// LDAP Connection Test Script
const ldap = require('ldapjs');
require('dotenv').config();

async function testLDAPConnection() {
  console.log('Testing LDAP Connection...');
  console.log('Configuration:');
  console.log('- URL:', process.env.LDAP_URL);
  console.log('- Bind DN:', process.env.LDAP_BIND_DN);
  console.log('- Search Base:', process.env.LDAP_SEARCH_BASE);
  console.log('- Search Filter:', process.env.LDAP_SEARCH_FILTER);
  console.log('');

  const client = ldap.createClient({
    url: process.env.LDAP_URL,
    timeout: 5000,
    connectTimeout: 5000,
  });

  return new Promise((resolve, reject) => {
    // Test 1: Basic connection
    client.on('error', (err) => {
      console.error('❌ LDAP Connection Error:', err.message);
      reject(err);
    });

    client.on('connect', () => {
      console.log('✅ Connected to LDAP server');
      
      // Test 2: Bind with service account
      console.log('Testing bind with service account...');
      client.bind(process.env.LDAP_BIND_DN, process.env.LDAP_BIND_PASSWORD, (bindErr) => {
        if (bindErr) {
          console.error('❌ Bind failed:', bindErr.message);
          client.destroy();
          reject(bindErr);
          return;
        }
        
        console.log('✅ Bind successful');
        
        // Test 3: Search for a test user
        const testUsername = 'testuser'; // Replace with a known username
        const searchFilter = process.env.LDAP_SEARCH_FILTER.replace('{{username}}', testUsername);
        console.log('Testing search with filter:', searchFilter);
        
        const opts = {
          filter: searchFilter,
          scope: 'sub',
          attributes: ['uid', 'cn', 'mail', 'displayName', 'sAMAccountName', 'userPrincipalName']
        };
        
        client.search(process.env.LDAP_SEARCH_BASE, opts, (searchErr, searchRes) => {
          if (searchErr) {
            console.error('❌ Search failed:', searchErr.message);
            client.destroy();
            reject(searchErr);
            return;
          }
          
          let userFound = false;
          
          searchRes.on('searchEntry', (entry) => {
            userFound = true;
            console.log('✅ Found user:', entry.object);
          });
          
          searchRes.on('error', (err) => {
            console.error('❌ Search error:', err.message);
            client.destroy();
            reject(err);
          });
          
          searchRes.on('end', (result) => {
            if (!userFound) {
              console.log('ℹ️  No users found with test filter (this is expected if testuser doesn\'t exist)');
            }
            console.log('✅ Search completed, status:', result.status);
            client.destroy();
            resolve('LDAP test completed successfully');
          });
        });
      });
    });
  });
}

// Run the test
testLDAPConnection()
  .then((result) => {
    console.log('\n🎉', result);
    process.exit(0);
  })
  .catch((error) => {
    console.log('\n💥 LDAP test failed:', error.message);
    process.exit(1);
  });