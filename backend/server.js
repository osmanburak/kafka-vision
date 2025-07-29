const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Kafka } = require('kafkajs');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const LdapAuth = require('ldapauth-fork');

dotenv.config();


const { configurePassport, isAuthenticated, authenticateLocal, authenticateLDAP } = require('./auth/ldapConfig');
const { encryptLdapSettings, decryptLdapSettings } = require('./utils/encryption');
const logger = require('./utils/logger');
const userManager = require('./utils/userManager');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Configure session store for persistence across server restarts
const FileStore = require('session-file-store')(session);

// Configure session middleware with persistent file store
const sessionMiddleware = session({
  store: new FileStore({
    path: './sessions',
    ttl: 86400, // 24 hours in seconds
    reapInterval: 3600 // Clean up expired sessions every hour
  }),
  secret: process.env.SESSION_SECRET || 'kafka-monitor-secret-key',
  resave: false,
  saveUninitialized: false,
  name: 'kafka-monitor-session',
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: false,
    maxAge: 24 * 60 * 60 * 1000
  }
});

app.use(sessionMiddleware);


// Configure CORS to allow credentials
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
configurePassport();

// Default Kafka configuration
const defaultBrokers = process.env.KAFKA_BROKERS || '192.168.1.189:9092';
let currentBrokers = defaultBrokers;

// Create Kafka instance factory
function createKafkaInstance(brokers) {
  return new Kafka({
    clientId: 'kafka-status-monitor',
    brokers: brokers.split(','),
    connectionTimeout: 30000,
    requestTimeout: 30000,
    retry: {
      initialRetryTime: 300,
      retries: 10
    },
    logLevel: 2, // ERROR
  });
}

let kafka = createKafkaInstance(currentBrokers);

// Cache for status data
let statusCache = {
  cluster: null,
  topics: [],
  consumerGroups: [],
  lastUpdated: null,
  error: null
};


// Create admin instance for each request to avoid connection issues
function createAdmin() {
  return kafka.admin();
}


// Function to fetch Kafka cluster metadata
async function getClusterMetadata() {
  const admin = createAdmin();
  
  try {
    logger.debug('Connecting to Kafka brokers:', process.env.KAFKA_BROKERS);
    await admin.connect();
    logger.info('Connected to Kafka successfully');
    
    // Get cluster info
    const cluster = await admin.describeCluster();
    logger.debug('Cluster info retrieved');
    
    const allTopics = await admin.listTopics();
    // Filter out system topics and sort alphabetically (case-insensitive)
    const topics = allTopics.filter(topic => !topic.startsWith('__')).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    logger.debug(`Found ${topics.length} topics (${allTopics.length - topics.length} system topics filtered out)`);
    
    const groups = await admin.listGroups();
    logger.debug(`Found ${groups.groups.length} consumer groups (before filtering)`);
    
    // Filter out temporary kafka-monitor-viewer groups and sort alphabetically (case-insensitive)
    const filteredGroups = groups.groups.filter(group => !group.groupId.startsWith('kafka-monitor-viewer-'));
    const sortedGroups = filteredGroups.sort((a, b) => a.groupId.toLowerCase().localeCompare(b.groupId.toLowerCase()));
    logger.debug(`After filtering: ${filteredGroups.length} consumer groups (removed ${groups.groups.length - filteredGroups.length} viewer groups)`);
    
    // Get topic details with message counts and consumer lag
    const topicMetadata = await Promise.all(
      topics.slice(0, 20).map(async (topic) => { // Increased limit to 20 topics
        try {
          const metadata = await admin.fetchTopicMetadata({ topics: [topic] });
          const offsets = await admin.fetchTopicOffsets(topic);
          
          // Calculate total messages per partition and overall
          let totalMessages = 0;
          let partitionDetails = [];
          
          for (const partition of offsets) {
            const high = BigInt(partition.high);
            const low = BigInt(partition.low);
            const messages = high - low;
            
            partitionDetails.push({
              partition: partition.partition,
              offset: partition.offset,
              high: partition.high,
              low: partition.low,
              messages: messages.toString(),
              consumerOffsets: {} // Will be populated below
            });
            
            totalMessages += Number(messages);
          }
          
          // Calculate consumer lag using Kafka consumer groups approach
          let hasActiveConsumers = false;
          let consumerGroupInfo = {};
          
          // For topic-level "behind" calculation, we need to find the minimum consumer offset per partition
          // across all consumer groups, then calculate total unconsumed messages
          let minConsumerOffsetsPerPartition = {};
          
          // Check consumer groups that are actively consuming this topic (sorted, excluding viewer groups)
          for (const group of sortedGroups.slice(0, 10)) {
            try {
              // This is equivalent to: kafka-consumer-groups.sh --describe --group <groupId>
              const groupOffsets = await admin.fetchOffsets({ 
                groupId: group.groupId, 
                topics: [topic] 
              });
              
              if (groupOffsets && groupOffsets.length > 0) {
                const topicOffsets = groupOffsets.find(g => g.topic === topic);
                if (topicOffsets && topicOffsets.partitions.length > 0) {
                  hasActiveConsumers = true;
                  let groupLag = 0;
                  
                  for (const partition of topicOffsets.partitions) {
                    // CURRENT-OFFSET (where consumer is at)
                    const rawCurrentOffset = partition.offset || '0';
                    const currentOffset = BigInt(rawCurrentOffset);
                    
                    // LOG-END-OFFSET (latest offset in partition)
                    const partitionOffsetData = offsets.find(o => o.partition === partition.partition);
                    const logEndOffset = BigInt(partitionOffsetData?.high || '0');
                    
                    // Check if partition is empty (low = high)
                    const isEmptyPartition = partitionOffsetData && partitionOffsetData.low === partitionOffsetData.high;
                    
                    // Check if consumer has never consumed from this partition
                    const hasNeverConsumed = rawCurrentOffset === '-1';
                    
                    // LAG calculation logic:
                    // 1. If partition is empty (low = high): lag = 0
                    // 2. If consumer never consumed (-1): lag = 0 (no lag without consumption)
                    // 3. Otherwise: lag = LOG-END-OFFSET - CURRENT-OFFSET
                    let lag = 0;
                    if (isEmptyPartition) {
                      lag = 0; // No messages to consume
                    } else if (hasNeverConsumed) {
                      lag = 0; // No lag if consumer hasn't started consuming
                    } else {
                      lag = Math.max(0, Number(logEndOffset - currentOffset)); // Normal lag
                    }
                    
                    groupLag += lag;
                    
                    // Track minimum consumer offset per partition (for topic-level calculation)
                    const partitionId = partition.partition;
                    if (!minConsumerOffsetsPerPartition[partitionId] || 
                        (!hasNeverConsumed && (minConsumerOffsetsPerPartition[partitionId].hasNever || currentOffset < minConsumerOffsetsPerPartition[partitionId].offset))) {
                      minConsumerOffsetsPerPartition[partitionId] = {
                        offset: hasNeverConsumed ? BigInt(partitionOffsetData?.low || '0') : currentOffset,
                        hasNever: hasNeverConsumed,
                        logEndOffset: logEndOffset
                      };
                    }
                    
                    // Add consumer offset info to partition details
                    const partitionDetail = partitionDetails.find(p => p.partition === partition.partition);
                    if (partitionDetail) {
                      partitionDetail.consumerOffsets[group.groupId] = {
                        currentOffset: rawCurrentOffset, // Keep original value (-1, 0, etc.)
                        lag: lag
                      };
                    }
                  }
                  
                  consumerGroupInfo[group.groupId] = groupLag;
                }
              }
            } catch (error) {
              // Group might not be consuming this topic or doesn't exist
              logger.debug(`Group ${group.groupId} not consuming topic ${topic}`);
            }
          }
          
          // Calculate total remaining messages based on minimum consumer positions across all partitions
          let totalRemainingMessages = 0;
          if (hasActiveConsumers) {
            for (const [partitionId, consumerInfo] of Object.entries(minConsumerOffsetsPerPartition)) {
              const partitionData = offsets.find(o => o.partition === parseInt(partitionId));
              if (partitionData) {
                const isEmptyPartition = partitionData.low === partitionData.high;
                if (!isEmptyPartition) {
                  const remaining = Math.max(0, Number(consumerInfo.logEndOffset - consumerInfo.offset));
                  totalRemainingMessages += remaining;
                }
              }
            }
          } else {
            totalRemainingMessages = totalMessages;
          }
          
          // If no active consumers, show total messages as remaining
          // If active consumers exist, use calculated totalRemainingMessages
          const remainingMessages = totalRemainingMessages;
          
          return {
            name: topic,
            partitions: metadata.topics[0]?.partitions.length || 0,
            totalMessages: totalMessages,
            partitionDetails: partitionDetails,
            replicas: metadata.topics[0]?.partitions[0]?.replicas?.length || 0,
            remainingMessages: remainingMessages,
            totalConsumed: hasActiveConsumers ? Math.max(0, totalMessages - remainingMessages) : 0,
            hasActiveConsumers: hasActiveConsumers,
            consumerGroupLag: consumerGroupInfo
          };
        } catch (error) {
          console.error(`Error fetching metadata for topic ${topic}:`, error.message);
          return {
            name: topic,
            partitions: 0,
            totalMessages: 0,
            remainingMessages: 0,
            error: error.message
          };
        }
      })
    );

    // Get consumer group details with member information (limit to first 10, already sorted)
    const groupDetails = await Promise.all(
      sortedGroups.slice(0, 10).map(async (group) => {
        try {
          const description = await admin.describeGroups([group.groupId]);
          const groupInfo = description.groups[0];
          
          if (groupInfo) {
            // Extract member details
            const memberDetails = groupInfo.members.map(member => ({
              memberId: member.memberId,
              clientId: member.clientId,
              clientHost: member.clientHost,
              assignments: member.memberAssignment ? Object.keys(member.memberAssignment) : []
            }));
            
            return {
              groupId: group.groupId,
              protocol: group.protocol,
              state: groupInfo.state,
              coordinator: groupInfo.coordinator,
              members: memberDetails,
              memberCount: memberDetails.length
            };
          } else {
            return {
              groupId: group.groupId,
              protocol: group.protocol,
              state: 'Unknown',
              members: [],
              memberCount: 0
            };
          }
        } catch (error) {
          console.error(`Error describing group ${group.groupId}:`, error.message);
          return {
            groupId: group.groupId,
            error: error.message,
            members: [],
            memberCount: 0
          };
        }
      })
    );

    // Sort topicMetadata by name to ensure consistent ordering
    const sortedTopicMetadata = topicMetadata.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    statusCache = {
      cluster: {
        brokers: cluster.brokers.map(broker => ({
          nodeId: broker.nodeId,
          host: broker.host,
          port: broker.port
        })),
        controllerId: cluster.controller,
        connectionString: currentBrokers, // Use current active connection
        advertisedBrokers: cluster.brokers.map(b => `${b.host}:${b.port}`).join(', ') // Add advertised hostnames
      },
      topics: sortedTopicMetadata,
      totalTopics: topics.length,
      consumerGroups: groupDetails,
      totalGroups: filteredGroups.length,
      lastUpdated: new Date().toISOString(),
      error: null
    };

    return statusCache;
  } catch (error) {
    console.error('Error fetching Kafka metadata:', error);
    statusCache.error = error.message;
    statusCache.lastUpdated = new Date().toISOString();
    throw error;
  } finally {
    try {
      await admin.disconnect();
      logger.debug('Disconnected from Kafka');
    } catch (disconnectError) {
      console.error('Error disconnecting from Kafka:', disconnectError);
    }
  }
}

// Authentication Routes
app.post('/api/auth/login', async (req, res, next) => {
  const { username, password } = req.body;
  
  logger.info(`🔐 Login attempt for user: ${username}`);
  logger.debug('Authentication settings:', {
    ldapEnabled: process.env.LDAP_ENABLED === 'true',
    authEnabled: process.env.AUTH_ENABLED !== 'false',
    hasPassword: !!password
  });

  try {
    // Check if it's a local user first
    logger.debug(`📋 Checking if '${username}' is a local user...`);
    const localUser = authenticateLocal(username, password);
    
    if (localUser) {
      logger.info(`✅ Local authentication successful for: ${username}`);
      req.logIn(localUser, (loginErr) => {
        if (loginErr) {
          logger.error('❌ Local session login error:', loginErr);
          return res.status(500).json({ error: 'Login failed' });
        }
        
        logger.debug('✅ Local req.logIn() successful, saving session...');
        
        // Explicitly save the session to ensure it's persisted
        req.session.save((saveErr) => {
          if (saveErr) {
            logger.error('❌ Local session save error:', saveErr);
            return res.status(500).json({ error: 'Session save failed' });
          }
          
          logger.info('✅ Local session saved successfully for user:', localUser.uid);
          
          // Debug cookie information for local user
          logger.debug('Local user response headers will include:', {
            setCookie: res.getHeader('Set-Cookie'),
            sessionCookie: req.sessionID
          });
          
          // Let express-session handle cookie setting naturally
          
          return res.json({ 
            success: true, 
            user: {
              uid: localUser.uid,
              displayName: localUser.displayName,
              mail: localUser.mail,
              isLocal: true,
              role: 'admin' // Local users are always admin
            }
          });
        });
      });
      return;
    }
    
    // If not a local user, try LDAP authentication (only if LDAP is enabled)
    if (process.env.LDAP_ENABLED === 'true') {
      logger.info(`🌐 User '${username}' not found in local users, attempting LDAP authentication`);
      const ldapUser = await authenticateLDAP(username, password);
      
      if (ldapUser) {
        logger.info(`✅ LDAP authentication successful for: ${username}`);
        
        // Check if user has permission
        logger.debug('🔍 Checking user permissions for LDAP user:', ldapUser.uid);
        let userRecord = await userManager.getUser(ldapUser.uid);
        logger.debug('📋 User record from userManager:', userRecord);
        
        if (!userRecord) {
          // First time login - create pending user
          userRecord = await userManager.addUser(ldapUser.uid, {
            displayName: ldapUser.displayName || ldapUser.cn || ldapUser.uid,
            email: ldapUser.mail || '',
            status: 'pending',
            role: 'user'
          });
          
          // Store user info in session for later approval check
          req.session.pendingLdapUser = ldapUser;
          
          // Return pending status
          return res.json({
            success: false,
            pendingApproval: true,
            message: 'Your account is pending approval from an administrator.'
          });
        }
      
        // Check user status
        logger.debug('👤 User status check:', { 
          username: ldapUser.uid, 
          status: userRecord.status,
          role: userRecord.role 
        });
        
        if (userRecord.status === 'pending') {
          // Store user info in session for later approval check
          req.session.pendingLdapUser = ldapUser;
          
          return res.json({
            success: false,
            pendingApproval: true,
            message: 'Your account is still pending approval from an administrator.'
          });
        }
      
        if (userRecord.status === 'rejected') {
          // Clear any pending session data
          delete req.session.pendingLdapUser;
          
          return res.json({
            success: false,
            rejected: true,
            message: 'Your access request has been denied. Please contact your administrator.'
          });
        }
      
        if (userRecord.status !== 'active') {
          logger.warn(`❌ LDAP user ${ldapUser.uid} account is not active. Status: ${userRecord.status}`);
          return res.json({
            success: false,
            error: 'Account is not active'
          });
        }
        
        logger.debug('✅ LDAP user has active status, proceeding to login');
      
        // Update last login - DISABLED TO PREVENT SERVER RESTART
        // try {
        //   await userManager.updateLastLogin(ldapUser.uid);
        //   logger.debug('✅ Updated last login time for user:', ldapUser.uid);
        // } catch (lastLoginError) {
        //   logger.error('❌ Failed to update last login time, but continuing login:', lastLoginError.message);
        // }
        
        // Add role to user object
        ldapUser.role = userRecord.role;
        
        // Clear any pending session data
        delete req.session.pendingLdapUser;
      
      req.logIn(ldapUser, (loginErr) => {
        if (loginErr) {
          logger.error('❌ Session login error:', loginErr);
          return res.status(500).json({ error: 'Login failed' });
        }
        
        logger.debug('✅ req.logIn() successful, saving session...');
        
        // Explicitly save the session to ensure it's persisted
        req.session.save((saveErr) => {
          if (saveErr) {
            logger.error('❌ Session save error:', saveErr);
            return res.status(500).json({ error: 'Session save failed' });
          }
          
          logger.info('✅ Session saved successfully for user:', ldapUser.uid);
          logger.debug('Session data after save:', {
            sessionID: req.sessionID,
            hasPassport: !!req.session.passport,
            user: req.session.passport ? req.session.passport.user : 'No user'
          });
          
          // Debug cookie information
          logger.debug('Response headers will include:', {
            setCookie: res.getHeader('Set-Cookie'),
            sessionCookie: req.sessionID
          });
          
          // Let express-session handle cookie setting naturally
          
          return res.json({ 
            success: true, 
            user: {
              uid: ldapUser.uid,
              displayName: ldapUser.displayName,
              mail: ldapUser.mail,
              role: userRecord.role,
              isLocal: false
            }
          });
        });
      });
      return;
    }
    } else {
      logger.warn(`❌ User '${username}' is not a local user but LDAP is disabled`);
      return res.status(401).json({ 
        error: 'LDAP authentication is disabled. Only local admin users can login.' 
      });
    }
  } catch (ldapError) {
    logger.error(`❌ LDAP authentication failed for user '${username}':`, ldapError.message);
    return res.status(401).json({ 
      error: 'LDAP authentication failed. Please check your credentials.' 
    });
  }
  
  // This should not be reached, but just in case
  logger.error(`Unexpected authentication flow end for user '${username}'`);
  return res.status(401).json({ error: 'Authentication failed' });
});

app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

app.get('/api/auth/check', (req, res) => {
  const authEnabled = process.env.AUTH_ENABLED === 'true';
  
  if (!authEnabled) {
    // Authentication disabled - return development user
    res.json({ 
      authenticated: true,
      authEnabled: false,
      user: {
        uid: 'dev',
        displayName: 'Development User',
        mail: 'dev@local',
        role: 'admin',
        isLocal: true
      }
    });
  } else if (req.isAuthenticated()) {
    res.json({ 
      authenticated: true,
      authEnabled: true,
      user: req.user
    });
  } else {
    res.json({ 
      authenticated: false,
      authEnabled: true
    });
  }
});

// Admin Settings Routes (only for local admin)
const isLocalAdmin = (req, res, next) => {
  logger.debug('Admin route accessed:', req.path);
  logger.debug('User authenticated:', req.isAuthenticated());
  logger.debug('User info:', req.user);
  
  if (!req.isAuthenticated()) {
    logger.debug('Authentication failed for admin route');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!req.user.isLocal || req.user.uid !== 'admin') {
    logger.debug('Authorization failed - not local admin:', req.user);
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  
  logger.debug('Admin access granted to:', req.user.uid);
  next();
};

// Admin middleware for any admin user (local or LDAP)
const isAdmin = (req, res, next) => {
  logger.debug('Admin route accessed:', req.path);
  logger.debug('User authenticated:', req.isAuthenticated());
  logger.debug('User info:', req.user);
  
  if (!req.isAuthenticated()) {
    logger.debug('Authentication failed for admin route');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if user is local admin OR has admin role
  const isLocalAdminUser = req.user.isLocal && req.user.uid === 'admin';
  const isLdapAdmin = req.user.role === 'admin';
  
  if (!isLocalAdminUser && !isLdapAdmin) {
    logger.debug('Authorization failed - not admin:', { user: req.user, isLocalAdminUser, isLdapAdmin });
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  
  logger.debug('Admin access granted to:', req.user.uid, 'role:', req.user.role);
  next();
};

// Debug route to list all registered routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(function(middleware) {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    }
  });
  res.json({ routes });
});

// Test route to verify admin routes are working
app.get('/api/admin/test', isLocalAdmin, (req, res) => {
  res.json({ message: 'Admin routes are working', user: req.user });
});

app.get('/api/admin/settings', isAdmin, (req, res) => {
  try {
    const sessionSecret = process.env.SESSION_SECRET || 'default-secret';
    
    // Get raw values from environment
    const rawBindDN = process.env.LDAP_BIND_DN || '';
    const rawBindPassword = process.env.LDAP_BIND_PASSWORD || '';
    const rawSearchBase = process.env.LDAP_SEARCH_BASE || '';
    
    logger.debug('Loading admin settings - raw values:', {
      bindDN: rawBindDN ? 'Present' : 'Empty',
      bindPassword: rawBindPassword ? 'Present' : 'Empty', 
      searchBase: rawSearchBase ? 'Present' : 'Empty'
    });
    
    // Decrypt sensitive LDAP settings for display (handles both encrypted and plain text)
    const decryptedSettings = decryptLdapSettings({
      bindDN: rawBindDN,
      bindPassword: rawBindPassword,
      searchBase: rawSearchBase
    }, sessionSecret);
    
    logger.debug('Decrypted settings for admin display:', {
      bindDN: decryptedSettings.bindDN || 'Empty',
      searchBase: decryptedSettings.searchBase || 'Empty',
      bindPassword: decryptedSettings.bindPassword ? 'Present' : 'Empty'
    });
    
    const settings = {
      ldap: {
        enabled: process.env.AUTH_ENABLED === 'true',
        url: process.env.LDAP_URL || '',
        bindDN: decryptedSettings.bindDN, // Send decrypted value for editing
        bindPassword: '', // Never send password to frontend
        searchBase: decryptedSettings.searchBase, // Send decrypted value for editing
        searchFilter: process.env.LDAP_SEARCH_FILTER || '(sAMAccountName={{username}})',
        tlsRejectUnauthorized: process.env.LDAP_TLS_REJECT_UNAUTHORIZED !== 'false'
      },
      // Removed app settings
    };
    
    logger.debug('Sending settings to admin UI:', {
      ldap: {
        enabled: settings.ldap.enabled,
        url: settings.ldap.url || 'Empty',
        bindDN: settings.ldap.bindDN || 'Empty',
        searchBase: settings.ldap.searchBase || 'Empty',
        searchFilter: settings.ldap.searchFilter || 'Empty'
      }
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error loading settings:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

app.post('/api/admin/settings', isAdmin, (req, res) => {
  try {
    const { ldap } = req.body;
    const fs = require('fs');
    const path = require('path');
    
    // Get session secret for encryption
    const sessionSecret = process.env.SESSION_SECRET || 'default-secret';
    
    // Read current .env file
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update environment variables
    const updateEnvVar = (key, value) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const newLine = `${key}=${value}`;
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, newLine);
      } else {
        envContent += `\n${newLine}`;
      }
    };
    
    // Update LDAP settings with encryption for sensitive fields
    if (ldap) {
      logger.debug('Updating LDAP settings...');
      updateEnvVar('AUTH_ENABLED', ldap.enabled.toString());
      updateEnvVar('LDAP_URL', ldap.url || '');
      
      // Encrypt sensitive LDAP settings
      logger.debug('Original LDAP settings:', {
        bindDN: ldap.bindDN ? 'Present' : 'Empty',
        bindPassword: ldap.bindPassword ? 'Present' : 'Empty',
        searchBase: ldap.searchBase ? 'Present' : 'Empty'
      });
      
      const encryptedLdapSettings = encryptLdapSettings({
        bindDN: ldap.bindDN || '',
        bindPassword: ldap.bindPassword || '',
        searchBase: ldap.searchBase || ''
      }, sessionSecret);
      
      logger.debug('Encrypted LDAP settings:', {
        bindDN: encryptedLdapSettings.bindDN.substring(0, 20) + '...',
        bindPassword: encryptedLdapSettings.bindPassword ? encryptedLdapSettings.bindPassword.substring(0, 20) + '...' : 'Empty',
        searchBase: encryptedLdapSettings.searchBase.substring(0, 20) + '...'
      });
      
      updateEnvVar('LDAP_BIND_DN', encryptedLdapSettings.bindDN);
      if (ldap.bindPassword) {
        updateEnvVar('LDAP_BIND_PASSWORD', encryptedLdapSettings.bindPassword);
      }
      updateEnvVar('LDAP_SEARCH_BASE', encryptedLdapSettings.searchBase);
      updateEnvVar('LDAP_SEARCH_FILTER', ldap.searchFilter || '(sAMAccountName={{username}})');
      updateEnvVar('LDAP_TLS_REJECT_UNAUTHORIZED', ldap.tlsRejectUnauthorized.toString());
    }
    
    // Removed app settings update
    
    // Write updated .env file
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    
    logger.debug('Settings updated by admin (with encryption):', req.user.uid);
    res.json({ success: true, message: 'Settings saved successfully with encryption' });
    
    // Note: In production, you might want to restart the application here
    // For now, we'll let the client handle the restart notification
    
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

app.post('/api/admin/test-ldap', isAdmin, async (req, res) => {
  try {
    // The frontend sends decrypted values, so we can use them directly for testing
    const { url, bindDN, bindPassword, searchBase } = req.body;
    const ldap = require('ldapjs');
    
    const client = ldap.createClient({
      url: url,
      timeout: 5000,
      connectTimeout: 5000,
    });
    
    const testConnection = () => {
      return new Promise((resolve, reject) => {
        client.on('error', (err) => {
          reject(err);
        });
        
        client.bind(bindDN, bindPassword, (bindErr) => {
          if (bindErr) {
            reject(bindErr);
            return;
          }
          
          // Test search
          client.search(searchBase, { filter: '(objectClass=*)', scope: 'base' }, (searchErr, searchRes) => {
            if (searchErr) {
              reject(searchErr);
              return;
            }
            
            searchRes.on('end', (result) => {
              client.destroy();
              resolve({ status: result.status, message: 'LDAP connection successful' });
            });
            
            searchRes.on('error', (err) => {
              reject(err);
            });
          });
        });
      });
    };
    
    const result = await testConnection();
    res.json(result);
    
  } catch (error) {
    console.error('LDAP test failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check approval status for pending users
app.get('/api/auth/check-approval', async (req, res) => {
  try {
    // Check if user has pending LDAP info in session
    const pendingUser = req.session.pendingLdapUser;
    
    if (!pendingUser) {
      return res.status(401).json({ error: 'No pending user session' });
    }
    
    // Check current status in database
    const userRecord = await userManager.getUser(pendingUser.uid);
    
    if (!userRecord) {
      return res.json({ 
        status: 'not_found',
        message: 'User record not found'
      });
    }
    
    if (userRecord.status === 'active') {
      // User has been approved! Complete the login
      // DISABLED TO PREVENT SERVER RESTART
      // try {
      //   await userManager.updateLastLogin(pendingUser.uid);
      //   logger.debug('✅ Updated last login time for approved user:', pendingUser.uid);
      // } catch (lastLoginError) {
      //   logger.error('❌ Failed to update last login time for approved user, but continuing:', lastLoginError.message);
      // }
      
      // Add role to user object
      pendingUser.role = userRecord.role;
      
      // Complete the login process
      req.logIn(pendingUser, (loginErr) => {
        if (loginErr) {
          logger.error('Session login error after approval:', loginErr);
          return res.status(500).json({ error: 'Login failed after approval' });
        }
        
        // Clear pending session data
        delete req.session.pendingLdapUser;
        
        return res.json({
          status: 'approved',
          success: true,
          user: {
            uid: pendingUser.uid,
            displayName: pendingUser.displayName,
            mail: pendingUser.mail,
            role: userRecord.role
          }
        });
      });
    } else if (userRecord.status === 'rejected') {
      // Clear pending session data
      delete req.session.pendingLdapUser;
      
      return res.json({
        status: 'rejected',
        message: 'Your access request has been denied. Please contact your administrator.'
      });
    } else {
      // Still pending
      return res.json({
        status: 'pending',
        message: 'Your account is still pending approval from an administrator.'
      });
    }
    
  } catch (error) {
    logger.error('Error checking approval status:', error);
    res.status(500).json({ error: 'Failed to check approval status' });
  }
});

// User Management Routes (any admin)
app.get('/api/admin/users', isAdmin, async (req, res) => {
  try {
    const users = await userManager.getAllUsers();
    res.json({ users });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/admin/users/:username/approve', isAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    const approvedBy = req.user.uid;
    
    const user = await userManager.approveUser(username, approvedBy);
    res.json({ success: true, user });
  } catch (error) {
    logger.error('Error approving user:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

app.post('/api/admin/users/:username/reject', isAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    const rejectedBy = req.user.uid;
    
    const user = await userManager.rejectUser(username, rejectedBy);
    res.json({ success: true, user });
  } catch (error) {
    logger.error('Error rejecting user:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

app.delete('/api/admin/users/:username', isAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    await userManager.deleteUser(username);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.put('/api/admin/users/:username/role', isAdmin, async (req, res) => {
  try {
    const { username } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const user = await userManager.updateUser(username, { role });
    
    // If the user being updated is currently logged in via this session, update their session
    if (req.user && req.user.uid === username) {
      req.user.role = role;
      logger.debug('Updated current user session role:', { username, role });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    logger.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// API Routes (protected)
app.get('/api/status', isAuthenticated, async (req, res) => {
  try {
    logger.debug('HTTP /api/status endpoint called by user:', req.user ? req.user.uid : 'unknown');
    const status = await getClusterMetadata();
    logger.debug('Sending HTTP status response:', {
      topicsCount: status.topics ? status.topics.length : 0,
      hasCluster: !!status.cluster,
      lastUpdated: status.lastUpdated
    });
    res.json(status);
  } catch (error) {
    logger.error('Error in /api/status endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Frontend logging endpoint
app.post('/api/logs', (req, res) => {
  try {
    const { logs } = req.body;
    
    if (Array.isArray(logs)) {
      logs.forEach(log => {
        const prefix = `[FRONTEND] [${log.url}]`;
        const message = `${prefix} ${log.message}`;
        
        switch (log.level) {
          case 'DEBUG':
            logger.debug(message);
            break;
          case 'INFO':
            logger.info(message);
            break;
          case 'WARN':
            logger.warn(message);
            break;
          case 'ERROR':
            logger.error(message);
            break;
          default:
            logger.debug(message);
        }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error processing frontend logs:', error);
    res.status(500).json({ error: 'Failed to process logs' });
  }
});

// Test connection endpoint
app.get('/api/test-connection', isAuthenticated, async (req, res) => {
  const admin = createAdmin();
  try {
    logger.debug('Testing connection to Kafka...');
    await admin.connect();
    const cluster = await admin.describeCluster();
    await admin.disconnect();
    
    res.json({
      success: true,
      brokers: cluster.brokers.length,
      controller: cluster.controller,
      message: 'Successfully connected to Kafka'
    });
  } catch (error) {
    console.error('Connection test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      brokers: process.env.KAFKA_BROKERS
    });
  }
});


// Get messages from a specific topic and partition
app.get('/api/messages/:topicName/:partition', isAuthenticated, async (req, res) => {
  const { topicName, partition } = req.params;
  const { startOffset, endOffset, limit = 10 } = req.query;
  
  logger.info(`Fetching messages from ${topicName} partition ${partition}, offsets ${startOffset}-${endOffset}, limit ${limit}`);
  
  const consumer = kafka.consumer({ groupId: 'kafka-monitor-viewer-' + Date.now() });
  
  try {
    await consumer.connect();
    
    const messages = [];
    
    await consumer.subscribe({ topic: topicName, fromBeginning: false });
    
    // Run consumer with message collection
    const consuming = consumer.run({
      eachMessage: async ({ topic, partition: msgPartition, message }) => {
        if (msgPartition === parseInt(partition) && 
            parseInt(message.offset) >= parseInt(startOffset) && 
            parseInt(message.offset) <= parseInt(endOffset)) {
          messages.push({
            offset: message.offset,
            timestamp: message.timestamp,
            key: message.key ? message.key.toString() : null,
            value: message.value ? message.value.toString() : null,
            size: message.size || 0
          });
          
          if (messages.length >= parseInt(limit) || 
              parseInt(message.offset) >= parseInt(endOffset)) {
            await consumer.pause([{ topic: topicName, partitions: [parseInt(partition)] }]);
          }
        }
      },
    });
    
    // Wait for consumer to be ready and seek to start offset
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      await consumer.seek({ 
        topic: topicName, 
        partition: parseInt(partition), 
        offset: startOffset.toString()
      });
    } catch (seekError) {
      console.error(`Failed to seek to offset ${startOffset}:`, seekError);
      // If seek fails, try to continue anyway
    }
    
    // Wait for messages or timeout
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (messages.length >= parseInt(limit) || messages.length > 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000); // 5 second timeout
    });
    
    await consumer.disconnect();
    
    res.json({
      topic: topicName,
      partition: parseInt(partition),
      messages: messages.slice(0, parseInt(limit)),
      count: messages.length
    });
  } catch (error) {
    logger.error(`Error fetching messages from ${topicName}:${partition}:`, error);
    console.error(`Error details:`, error.stack);
    try {
      await consumer.disconnect();
    } catch (e) {
      logger.error('Failed to disconnect consumer:', e);
    }
    res.status(500).json({ error: error.message });
  }
});

// Test Kafka connection
app.post('/api/test-connection', isAuthenticated, async (req, res) => {
  const { brokers } = req.body;
  
  logger.info(`Testing connection to brokers: ${brokers}`);
  
  if (!brokers) {
    return res.status(400).json({ success: false, message: 'Brokers required' });
  }

  const testKafka = createKafkaInstance(brokers);
  const testAdmin = testKafka.admin();
  
  try {
    logger.debug('Connecting to test Kafka instance...');
    await testAdmin.connect();
    
    logger.debug('Describing cluster...');
    const cluster = await testAdmin.describeCluster();
    
    logger.debug('Disconnecting from test instance...');
    await testAdmin.disconnect();
    
    res.json({ 
      success: true, 
      message: `Connected to cluster with ${cluster.brokers.length} broker(s)`,
      cluster: {
        brokers: cluster.brokers.length,
        controller: cluster.controller
      }
    });
  } catch (error) {
    logger.error('Connection test failed:', error);
    console.error('Connection test error details:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Connection failed' 
    });
  }
});

// Change active connection
app.post('/api/change-connection', isAuthenticated, async (req, res) => {
  const { brokers } = req.body;
  
  if (!brokers) {
    return res.status(400).json({ success: false, message: 'Brokers required' });
  }

  try {
    // Test new connection first
    const testKafka = createKafkaInstance(brokers);
    const testAdmin = testKafka.admin();
    await testAdmin.connect();
    await testAdmin.disconnect();
    
    // If successful, update the current connection
    currentBrokers = brokers;
    kafka = createKafkaInstance(currentBrokers);
    
    // Clear cache to force refresh
    statusCache = {
      cluster: null,
      topics: [],
      consumerGroups: [],
      lastUpdated: null,
      error: null
    };
    
    // Restart periodic updates
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    startPeriodicUpdates(currentRefreshRate);
    
    res.json({ 
      success: true, 
      message: 'Connection changed successfully',
      brokers: currentBrokers
    });
  } catch (error) {
    console.error('Failed to change connection:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to change connection' 
    });
  }
});

// Get current connection info
app.get('/api/current-connection', isAuthenticated, (req, res) => {
  res.json({
    brokers: currentBrokers,
    default: currentBrokers === defaultBrokers
  });
});

// Get detailed topic information
app.get('/api/topics/:topicName', isAuthenticated, async (req, res) => {
  const { topicName } = req.params;
  const admin = createAdmin();
  
  try {
    await admin.connect();
    
    const metadata = await admin.fetchTopicMetadata({ topics: [topicName] });
    const offsets = await admin.fetchTopicOffsets(topicName);
    const configs = await admin.describeConfigs({
      includeSynonyms: false,
      resources: [{
        type: 2, // Topic
        name: topicName
      }]
    });
    
    // Get consumer group offsets for this topic
    const groups = await admin.listGroups();
    const consumer = kafka.consumer({ groupId: 'kafka-monitor-temp' });
    
    let consumerLag = [];
    for (const group of groups.groups.slice(0, 5)) { // Limit to 5 groups
      try {
        const offsets = await admin.fetchOffsets({ 
          groupId: group.groupId, 
          topics: [topicName] 
        });
        
        if (offsets && offsets.length > 0) {
          consumerLag.push({
            groupId: group.groupId,
            lag: offsets[0].partitions.map(p => ({
              partition: p.partition,
              offset: p.offset,
              lag: p.metadata
            }))
          });
        }
      } catch (error) {
        // Group might not be consuming this topic
      }
    }
    
    await admin.disconnect();
    
    res.json({
      topic: topicName,
      metadata: metadata.topics[0],
      offsets: offsets,
      configs: configs.resources[0]?.configs || [],
      consumerLag: consumerLag
    });
  } catch (error) {
    console.error(`Error fetching topic details for ${topicName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Share session middleware with socket.io
io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res || {}, next);
});

// Initialize passport for WebSocket sessions
io.use((socket, next) => {
  passport.initialize()(socket.request, socket.request.res || {}, next);
});

io.use((socket, next) => {
  passport.session()(socket.request, socket.request.res || {}, next);
});

// WebSocket connection for real-time updates
io.on('connection', (socket) => {
  logger.debug('🔌 WebSocket client connected:', socket.id);
  
  // Increase delay to allow file-based session to be fully loaded
  setTimeout(async () => {
    // Force session reload to ensure we have the latest data
    if (socket.request.session && socket.request.session.reload) {
      socket.request.session.reload((err) => {
        if (err) {
          logger.error('WebSocket session reload error:', err);
        } else {
          logger.debug('WebSocket session reloaded successfully');
        }
      });
    }
    
    // Detailed session debugging
    logger.debug('WebSocket session debug:', {
      hasSession: !!socket.request.session,
      sessionID: socket.request.sessionID,
      sessionObject: socket.request.session ? Object.keys(socket.request.session) : 'No session',
      hasPassport: !!(socket.request.session && socket.request.session.passport),
      passportObject: socket.request.session && socket.request.session.passport ? Object.keys(socket.request.session.passport) : 'No passport',
      hasUser: !!(socket.request.session && socket.request.session.passport && socket.request.session.passport.user),
      user: socket.request.session && socket.request.session.passport ? socket.request.session.passport.user : 'No user',
      isAuthenticated: !!(socket.request.isAuthenticated && socket.request.isAuthenticated()),
      authEnabled: process.env.AUTH_ENABLED !== 'false',
      headers: socket.request.headers.cookie ? 'Cookie present' : 'No cookie',
      fullSession: socket.request.session ? JSON.stringify(socket.request.session, null, 2) : 'No session'
    });
    
    // Check if user is authenticated (skip if auth is disabled)
    const isAuthenticated = process.env.AUTH_ENABLED === 'false' || 
                           (socket.request.isAuthenticated && socket.request.isAuthenticated()) ||
                           (socket.request.session && socket.request.session.passport && socket.request.session.passport.user);
    
    logger.debug('WebSocket authentication check result:', {
      authEnabled: process.env.AUTH_ENABLED !== 'false',
      hasIsAuthenticated: typeof socket.request.isAuthenticated === 'function',
      isAuthenticatedResult: socket.request.isAuthenticated ? socket.request.isAuthenticated() : 'N/A',
      hasSessionPassportUser: !!(socket.request.session && socket.request.session.passport && socket.request.session.passport.user),
      finalAuthResult: isAuthenticated
    });
    
    if (!isAuthenticated) {
      logger.warn('❌ Unauthenticated WebSocket connection, disconnecting:', socket.id, {
        sessionExists: !!socket.request.session,
        passportExists: !!(socket.request.session && socket.request.session.passport),
        userExists: !!(socket.request.session && socket.request.session.passport && socket.request.session.passport.user),
        sessionData: socket.request.session ? JSON.stringify(socket.request.session, null, 2) : 'No session'
      });
      socket.disconnect();
      return;
    }
    
    logger.info('✅ Authenticated WebSocket connection established:', socket.id);
    
    // Send initial status after authentication is confirmed
    // Check if statusCache is empty or uninitialized
    const cacheIsEmpty = !statusCache.cluster || !statusCache.topics || statusCache.topics.length === 0;
    
    logger.debug('Sending initial status to WebSocket client:', {
      socketId: socket.id,
      statusCacheKeys: Object.keys(statusCache),
      topicsCount: statusCache.topics ? statusCache.topics.length : 0,
      hasCluster: !!statusCache.cluster,
      lastUpdated: statusCache.lastUpdated,
      cacheIsEmpty: cacheIsEmpty
    });
    
    if (cacheIsEmpty) {
      logger.debug('StatusCache is empty, fetching fresh data for WebSocket client:', socket.id);
      // Fetch fresh data for this WebSocket client
      try {
        const freshStatus = await getClusterMetadata();
        logger.debug('Sending fresh status data to WebSocket client:', {
          socketId: socket.id,
          topicsCount: freshStatus.topics ? freshStatus.topics.length : 0,
          hasCluster: !!freshStatus.cluster,
          lastUpdated: freshStatus.lastUpdated
        });
        socket.emit('status', freshStatus);
      } catch (error) {
        logger.error('Error fetching fresh status for WebSocket client:', error);
        socket.emit('status', {
          cluster: null,
          topics: [],
          consumerGroups: [],
          lastUpdated: new Date().toISOString(),
          error: `Failed to fetch Kafka data: ${error.message}`
        });
      }
    } else {
      socket.emit('status', statusCache);
    }
    
    // Handle refresh rate changes - only for authenticated connections
    socket.on('setRefreshRate', (newRate) => {
      const refreshRate = newRate * 1000; // Convert seconds to milliseconds
      if (refreshRate !== currentRefreshRate) {
        logger.debug(`Changing refresh rate to ${newRate}s`);
        startPeriodicUpdates(refreshRate);
        // Notify all clients about the new refresh rate
        io.emit('refreshRateChanged', newRate);
      }
    });
    
    socket.on('disconnect', () => {
      logger.debug('Authenticated client disconnected:', socket.id);
    });
  }, 500); // Increased delay for file-based session loading
});

// Periodic status updates with error recovery
let updateInterval;
let isUpdating = false;
let currentRefreshRate = 30000; // Default 30 seconds

async function startPeriodicUpdates(refreshRate = 30000) {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  currentRefreshRate = refreshRate;
  
  updateInterval = setInterval(async () => {
    if (isUpdating) {
      logger.debug('Previous update still in progress, skipping...');
      return;
    }
    
    isUpdating = true;
    try {
      const status = await getClusterMetadata();
      logger.debug('Emitting periodic status update to all clients:', {
        topicsCount: status.topics ? status.topics.length : 0,
        hasCluster: !!status.cluster,
        lastUpdated: status.lastUpdated,
        connectedClientsCount: io.engine.clientsCount
      });
      io.emit('status', status);
    } catch (error) {
      console.error('Error in periodic update:', error.message);
      io.emit('status', { 
        ...statusCache, 
        error: `Connection error: ${error.message}`,
        lastUpdated: new Date().toISOString()
      });
    } finally {
      isUpdating = false;
    }
  }, refreshRate);
  
  logger.info(`Periodic updates started with ${refreshRate/1000}s interval`);
}

// Start periodic updates with default interval
startPeriodicUpdates();

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  logger.debug(`Server running on port ${PORT}`);
});