// Debug LDAP Authentication Script
const { authenticateLDAP } = require('./auth/ldapConfig');
require('dotenv').config();

async function debugLDAPAuth() {
  console.log('=== LDAP Authentication Debug ===');
  console.log('Environment Variables:');
  console.log('- LDAP_URL:', process.env.LDAP_URL);
  console.log('- LDAP_BIND_DN:', process.env.LDAP_BIND_DN);
  console.log('- LDAP_SEARCH_BASE:', process.env.LDAP_SEARCH_BASE);
  console.log('- LDAP_SEARCH_FILTER:', process.env.LDAP_SEARCH_FILTER);
  console.log('');

  // Test with a real username and password
  const testUsername = 'your_username_here'; // Replace with actual username
  const testPassword = 'your_password_here'; // Replace with actual password

  console.log('Testing authentication for user:', testUsername);
  console.log('Password provided:', !!testPassword);
  console.log('');

  try {
    const result = await authenticateLDAP(testUsername, testPassword);
    console.log('✅ Authentication successful!');
    console.log('User result:', result);
  } catch (error) {
    console.log('❌ Authentication failed!');
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    if (error.stack) {
      console.log('Error stack:', error.stack);
    }
  }

  process.exit(0);
}

// Run the debug
debugLDAPAuth();