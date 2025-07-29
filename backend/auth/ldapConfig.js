const passport = require('passport');
const logger = require('../utils/logger');
const LdapAuthStrategy = require('passport-ldapauth');
const { decryptLdapSettings } = require('../utils/encryption');

// LDAP configuration from environment variables
const getLdapConfig = () => {
  const sessionSecret = process.env.SESSION_SECRET || 'default-secret';
  
  // Decrypt sensitive LDAP settings
  const decryptedSettings = decryptLdapSettings({
    bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=example,dc=com',
    bindPassword: process.env.LDAP_BIND_PASSWORD || 'admin',
    searchBase: process.env.LDAP_SEARCH_BASE || 'dc=example,dc=com'
  }, sessionSecret);
  
  const config = {
    server: {
      url: process.env.LDAP_URL || 'ldap://localhost:389',
      bindDN: decryptedSettings.bindDN,
      bindCredentials: decryptedSettings.bindPassword,
      searchBase: decryptedSettings.searchBase,
      searchFilter: process.env.LDAP_SEARCH_FILTER || '(uid={{username}})',
      searchAttributes: ['uid', 'cn', 'mail', 'displayName', 'sAMAccountName', 'userPrincipalName'],
      tlsOptions: {
        rejectUnauthorized: process.env.LDAP_TLS_REJECT_UNAUTHORIZED !== 'false'
      }
    }
  };
  
  logger.debug('LDAP Configuration:', {
    url: config.server.url,
    bindDN: config.server.bindDN,
    searchBase: config.server.searchBase,
    searchFilter: config.server.searchFilter,
    tlsRejectUnauthorized: config.server.tlsOptions.rejectUnauthorized
  });
  
  return config;
};

// Local authentication fallback for development
const localUsers = {
  admin: {
    password: process.env.LOCAL_ADMIN_PASSWORD || 'admin123',
    displayName: 'Local Admin',
    mail: 'admin@local'
  }
};

// Manual LDAP authentication using ldapjs
const ldap = require('ldapjs');

const authenticateLDAP = (username, password) => {
  return new Promise((resolve, reject) => {
    // Validate inputs
    if (!username || typeof username !== 'string') {
      reject(new Error('Username must be a valid string'));
      return;
    }
    if (!password || typeof password !== 'string') {
      reject(new Error('Password must be a valid string'));
      return;
    }

    logger.debug('LDAP Auth attempt for user:', username);
    logger.debug('Password length:', password ? password.length : 0);
    
    const client = ldap.createClient({
      url: process.env.LDAP_URL,
      timeout: 5000,
      connectTimeout: 5000,
    });

    client.on('error', (err) => {
      console.error('LDAP Client Error:', err);
      reject(err);
    });

    // First, bind with service account - decrypt sensitive values
    const sessionSecret = process.env.SESSION_SECRET || 'default-secret';
    const decryptedSettings = decryptLdapSettings({
      bindDN: process.env.LDAP_BIND_DN || '',
      bindPassword: process.env.LDAP_BIND_PASSWORD || '',
      searchBase: process.env.LDAP_SEARCH_BASE || ''
    }, sessionSecret);
    
    const bindDN = decryptedSettings.bindDN;
    const bindPassword = decryptedSettings.bindPassword;
    
    logger.debug('Binding with service account:', bindDN);
    
    client.bind(bindDN, bindPassword, (bindErr) => {
      if (bindErr) {
        console.error('Service account bind failed:', bindErr);
        client.destroy();
        reject(bindErr);
        return;
      }

      // Search for the user with a more specific filter
      const baseFilter = process.env.LDAP_SEARCH_FILTER || '(sAMAccountName={{username}})';
      const searchFilter = baseFilter.includes('{{username}}') 
        ? baseFilter.replace('{{username}}', username)
        : `(&${baseFilter}(sAMAccountName=${username}))`;
      
      logger.debug('Using search filter:', searchFilter);
      
      const opts = {
        filter: searchFilter,
        scope: 'sub',
        attributes: ['uid', 'cn', 'mail', 'displayName', 'sAMAccountName', 'userPrincipalName', 'dn'],
        sizeLimit: 1 // Only need one user
      };

      client.search(decryptedSettings.searchBase, opts, (searchErr, searchRes) => {
        if (searchErr) {
          console.error('User search failed:', searchErr);
          client.destroy();
          reject(searchErr);
          return;
        }

        let userDN = null;
        let userInfo = {};

        searchRes.on('searchEntry', (entry) => {
          logger.debug('Raw LDAP entry:', JSON.stringify(entry, null, 2));
          logger.debug('Entry type:', typeof entry);
          logger.debug('Entry keys:', Object.keys(entry));
          
          userDN = entry.objectName || entry.dn?.toString() || entry.dn;
          logger.debug('Extracted DN:', userDN, 'Type:', typeof userDN);
          
          // Try multiple ways to extract attributes
          logger.debug('Trying to extract attributes...');
          
          // Method 1: entry.object (most common)
          if (entry.object) {
            logger.debug('Found entry.object:', entry.object);
            userInfo = { ...entry.object };
          }
          
          // Method 2: entry.attributes array
          if (entry.attributes && Array.isArray(entry.attributes)) {
            logger.debug('Found entry.attributes array:', entry.attributes.length, 'items');
            entry.attributes.forEach(attr => {
              logger.debug('Processing attribute:', attr.type, 'values:', attr.values || attr.vals);
              // Use .values (new) or fallback to .vals (deprecated) for compatibility
              const values = attr.values || attr.vals;
              if (values && values.length > 0) {
                userInfo[attr.type] = values[0];
              }
            });
          }
          
          // Method 3: entry direct properties
          ['uid', 'cn', 'mail', 'displayName', 'sAMAccountName', 'userPrincipalName'].forEach(attr => {
            if (entry[attr]) {
              logger.debug(`Found direct property ${attr}:`, entry[attr]);
              userInfo[attr] = Array.isArray(entry[attr]) ? entry[attr][0] : entry[attr];
            }
          });
          
          logger.debug('Final user DN:', userDN);
          logger.debug('Final user attributes:', userInfo);
          logger.debug('User info keys:', Object.keys(userInfo));
        });

        searchRes.on('error', (err) => {
          console.error('Search error:', err);
          client.destroy();
          reject(err);
        });

        searchRes.on('end', () => {
          if (!userDN) {
            logger.warn('User not found in LDAP search:', username);
            logger.debug('Search filter used:', searchFilter);
            logger.debug('Search base used:', decryptedSettings.searchBase);
            client.destroy();
            reject(new Error(`User '${username}' not found in LDAP directory`));
            return;
          }

          // Validate we have the necessary information
          if (!userDN) {
            console.error('No user DN found');
            client.destroy();
            reject(new Error('User not found in LDAP'));
            return;
          }
          
          // Convert DN to string if it's an object
          let finalDN = userDN;
          if (typeof userDN === 'object' && userDN.toString) {
            finalDN = userDN.toString();
          } else if (typeof userDN !== 'string') {
            console.error('Invalid DN type:', typeof userDN, userDN);
            client.destroy();
            reject(new Error('Invalid user DN format'));
            return;
          }
          
          // Try to bind with user credentials
          logger.debug('Attempting user bind with DN:', finalDN);
          logger.debug('DN type:', typeof finalDN);
          logger.debug('DN length:', finalDN ? finalDN.length : 0);
          logger.debug('Password type:', typeof password);
          logger.debug('Password exists:', !!password);
          logger.debug('Password length:', password ? password.length : 0);
          
          // Ensure password is a string and not empty
          if (!password || typeof password !== 'string') {
            console.error('Invalid password provided');
            client.destroy();
            reject(new Error('Invalid password'));
            return;
          }
          
          const userPassword = String(password);
          logger.debug('Final userPassword type:', typeof userPassword);
          logger.debug('Final userPassword length:', userPassword.length);
          
          // Try multiple DN formats for Active Directory
          const dnFormats = [
            finalDN, // Original DN from LDAP search
            `${username}@arvento.com`, // UPN format
            `ARVENTO\\${username}`, // DOMAIN\user format
            username // Simple username
          ].filter(dn => dn && dn.trim() !== ''); // Remove empty or null DNs
          
          logger.debug('Will try DN formats:', dnFormats);
          
          // Try each DN format sequentially
          function tryNextDN(index) {
            if (index >= dnFormats.length) {
              logger.error('All DN formats failed for user:', username);
              logger.error('Tried DN formats:', dnFormats);
              client.destroy();
              reject(new Error(`Authentication failed - tried ${dnFormats.length} DN formats: ${dnFormats.join(', ')}`));
              return;
            }
            
            const tryDN = dnFormats[index];
            logger.debug(`Trying DN format ${index + 1}: ${tryDN}`);
            
            const bindClient = ldap.createClient({
              url: process.env.LDAP_URL,
              timeout: 5000,
              connectTimeout: 5000,
            });
            
            bindClient.on('error', (bindConnErr) => {
              logger.error(`Connection error for DN ${tryDN}:`, bindConnErr.message);
              bindClient.destroy();
              tryNextDN(index + 1);
            });
            
            bindClient.bind(tryDN, userPassword, (userBindErr) => {
              bindClient.destroy();
              
              if (!userBindErr) {
                logger.info(`✅ Authentication successful with DN format: ${tryDN}`);
                client.destroy();
                logger.info('User authenticated successfully:', username);
                
                // Safely extract user information
                const userResult = {
                  uid: userInfo.sAMAccountName || userInfo.uid || username,
                  displayName: userInfo.displayName || userInfo.cn || username,
                  mail: userInfo.mail || `${username}@arvento.com`,
                  isLocal: false
                };
                
                logger.info('Returning user object:', userResult);
                resolve(userResult);
              } else {
                logger.warn(`❌ Failed with DN format ${tryDN}:`, userBindErr.message);
                logger.debug('Full bind error details:', userBindErr);
                // Try next DN format
                tryNextDN(index + 1);
              }
            });
          }
          
          // Start trying DN formats
          tryNextDN(0);
        });
      });
    });
  });
};

// Configure passport with LDAP strategy
const configurePassport = () => {
  // LDAP Authentication Strategy
  passport.use(new LdapAuthStrategy(getLdapConfig()));

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, {
      uid: user.uid || user.username,
      displayName: user.displayName || user.cn || user.uid,
      mail: user.mail,
      isLocal: user.isLocal || false,
      role: user.role || 'user'
    });
  });

  // Deserialize user from session
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
};

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (process.env.AUTH_ENABLED === 'false') {
    // Skip authentication in development if disabled
    req.user = { uid: 'dev', displayName: 'Development User', mail: 'dev@local' };
    return next();
  }

  // Add detailed debugging for HTTP authentication
  logger.debug(`🔒 Auth check for ${req.method} ${req.path}:`, {
    isAuthenticated: req.isAuthenticated && req.isAuthenticated(),
    hasSession: !!req.session,
    hasPassport: !!(req.session && req.session.passport),
    hasUser: !!(req.session && req.session.passport && req.session.passport.user),
    sessionId: req.sessionID,
    cookies: req.headers.cookie,
    userAgent: req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 50) : 'No user-agent'
  });

  if (req.isAuthenticated()) {
    return next();
  }
  
  logger.warn(`❌ Authentication failed for ${req.method} ${req.path}`);
  res.status(401).json({ error: 'Authentication required' });
};

// Local authentication fallback
const authenticateLocal = (username, password) => {
  const user = localUsers[username];
  if (user && user.password === password) {
    return {
      uid: username,
      username: username,
      displayName: user.displayName,
      mail: user.mail,
      isLocal: true,
      role: 'admin' // Local users are always admin
    };
  }
  return null;
};

module.exports = {
  configurePassport,
  isAuthenticated,
  authenticateLocal,
  authenticateLDAP,
  getLdapConfig
};