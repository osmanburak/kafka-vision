const fs = require('fs').promises;
const path = require('path');
const { encrypt, decrypt } = require('./encryption');

const USERS_FILE = path.join(__dirname, '../data/users.json');

// Get session secret from environment
const getSessionSecret = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required for user data encryption');
  }
  return secret;
};

class UserManager {
  constructor() {
    this.ensureDataDir();
  }

  async ensureDataDir() {
    const dataDir = path.dirname(USERS_FILE);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
      await this.saveUsers({ users: {} });
    }
  }

  async loadUsers() {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      const sessionSecret = getSessionSecret();
      
      // Decrypt user data
      const users = {};
      for (const [username, userData] of Object.entries(parsed.users)) {
        users[username] = {
          ...userData,
          email: userData.email ? decrypt(userData.email, sessionSecret) : '',
          displayName: userData.displayName ? decrypt(userData.displayName, sessionSecret) : username
        };
      }
      
      return { users };
    } catch (error) {
      console.error('Error loading users:', error);
      return { users: {} };
    }
  }

  async saveUsers(data) {
    // Encrypt sensitive user data
    const encryptedData = { users: {} };
    const sessionSecret = getSessionSecret();
    
    for (const [username, userData] of Object.entries(data.users)) {
      encryptedData.users[username] = {
        ...userData,
        email: userData.email ? encrypt(userData.email, sessionSecret) : '',
        displayName: userData.displayName ? encrypt(userData.displayName, sessionSecret) : encrypt(username, sessionSecret)
      };
    }
    
    await fs.writeFile(USERS_FILE, JSON.stringify(encryptedData, null, 2));
  }

  async getUser(username) {
    const { users } = await this.loadUsers();
    return users[username.toLowerCase()];
  }

  async addUser(username, userData) {
    const { users } = await this.loadUsers();
    users[username.toLowerCase()] = {
      username: username.toLowerCase(),
      displayName: userData.displayName || username,
      email: userData.email || '',
      status: userData.status || 'pending',
      role: userData.role || 'user',
      createdAt: userData.createdAt || new Date().toISOString(),
      lastLogin: userData.lastLogin || null,
      approvedBy: userData.approvedBy || null,
      approvedAt: userData.approvedAt || null
    };
    await this.saveUsers({ users });
    return users[username.toLowerCase()];
  }

  async updateUser(username, updates) {
    const { users } = await this.loadUsers();
    const user = users[username.toLowerCase()];
    if (!user) {
      throw new Error('User not found');
    }
    
    users[username.toLowerCase()] = {
      ...user,
      ...updates,
      username: username.toLowerCase() // Ensure username doesn't change
    };
    
    await this.saveUsers({ users });
    return users[username.toLowerCase()];
  }

  async approveUser(username, approvedBy) {
    return await this.updateUser(username, {
      status: 'active',
      approvedBy,
      approvedAt: new Date().toISOString()
    });
  }

  async rejectUser(username, rejectedBy) {
    return await this.updateUser(username, {
      status: 'rejected',
      rejectedBy,
      rejectedAt: new Date().toISOString()
    });
  }

  async getAllUsers() {
    const { users } = await this.loadUsers();
    return Object.values(users);
  }

  async deleteUser(username) {
    const { users } = await this.loadUsers();
    delete users[username.toLowerCase()];
    await this.saveUsers({ users });
  }

  async updateLastLogin(username) {
    return await this.updateUser(username, {
      lastLogin: new Date().toISOString()
    });
  }
}

module.exports = new UserManager();