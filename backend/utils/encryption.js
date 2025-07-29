const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Generates a master key from the session secret
 * @param {string} sessionSecret - The session secret from environment
 * @returns {Buffer} - The derived encryption key
 */
function deriveKey(sessionSecret) {
  if (!sessionSecret || sessionSecret === '') {
    console.error('❌ Session secret is missing or empty for encryption operations');
    console.error('Environment SESSION_SECRET:', process.env.SESSION_SECRET ? 'SET' : 'MISSING');
    throw new Error('Session secret is required for encryption');
  }
  
  // Use a fixed salt for consistency across restarts
  const salt = crypto.createHash('sha256').update('kafka-monitor-salt').digest();
  return crypto.pbkdf2Sync(sessionSecret, salt, 100000, 32, 'sha256');
}

/**
 * Encrypts sensitive data
 * @param {string} text - The text to encrypt
 * @param {string} sessionSecret - The session secret for key derivation
 * @returns {string} - Base64 encoded encrypted data with IV and auth tag
 */
function encrypt(text, sessionSecret) {
  if (!text || typeof text !== 'string') {
    return text; // Return as-is if not a string or empty
  }
  
  try {
    const key = deriveKey(sessionSecret);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV + encrypted data + auth tag, then base64 encode
    const combined = Buffer.concat([
      iv,
      Buffer.from(encrypted, 'hex'),
      authTag
    ]);
    
    return 'ENC:' + combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Return original text if encryption fails
  }
}

/**
 * Decrypts sensitive data
 * @param {string} encryptedText - The encrypted text (prefixed with ENC:)
 * @param {string} sessionSecret - The session secret for key derivation
 * @returns {string} - The decrypted text
 */
function decrypt(encryptedText, sessionSecret) {
  if (!encryptedText || typeof encryptedText !== 'string') {
    return encryptedText; // Return as-is if not a string or empty
  }
  
  // Check if the text is encrypted (prefixed with ENC:)
  if (!encryptedText.startsWith('ENC:')) {
    return encryptedText; // Return as-is if not encrypted
  }
  
  try {
    const key = deriveKey(sessionSecret);
    const combined = Buffer.from(encryptedText.substring(4), 'base64');
    
    // Extract IV, encrypted data, and auth tag
    const iv = combined.subarray(0, IV_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH);
    const authTag = combined.subarray(combined.length - TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    console.warn('Failed to decrypt value, returning as-is:', encryptedText.substring(0, 20) + '...');
    return encryptedText; // Return encrypted text if decryption fails
  }
}

/**
 * Checks if a value is encrypted
 * @param {string} value - The value to check
 * @returns {boolean} - True if the value is encrypted
 */
function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith('ENC:');
}

/**
 * Encrypts LDAP settings for storage
 * @param {object} ldapSettings - The LDAP settings object
 * @param {string} sessionSecret - The session secret
 * @returns {object} - LDAP settings with encrypted sensitive fields
 */
function encryptLdapSettings(ldapSettings, sessionSecret) {
  const sensitiveFields = ['bindDN', 'bindPassword', 'searchBase'];
  const encrypted = { ...ldapSettings };
  
  sensitiveFields.forEach(field => {
    if (encrypted[field]) {
      encrypted[field] = encrypt(encrypted[field], sessionSecret);
    }
  });
  
  return encrypted;
}

/**
 * Decrypts LDAP settings for use
 * @param {object} ldapSettings - The LDAP settings object with encrypted fields
 * @param {string} sessionSecret - The session secret
 * @returns {object} - LDAP settings with decrypted sensitive fields
 */
function decryptLdapSettings(ldapSettings, sessionSecret) {
  const sensitiveFields = ['bindDN', 'bindPassword', 'searchBase'];
  const decrypted = { ...ldapSettings };
  
  sensitiveFields.forEach(field => {
    if (decrypted[field]) {
      decrypted[field] = decrypt(decrypted[field], sessionSecret);
    }
  });
  
  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
  isEncrypted,
  encryptLdapSettings,
  decryptLdapSettings
};