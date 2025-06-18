const axios = require('axios');

const API_BASE_URL = 'http://192.168.86.8:3000';

async function testAPI() {
  console.log('🌐 Testing API Connection...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${API_BASE_URL}/`);
    console.log('✅ Server is running');
    console.log('   Response:', healthResponse.data);

    // Test 2: Check users endpoint
    console.log('\n2. Testing users endpoint...');
    try {
      const usersResponse = await axios.get(`${API_BASE_URL}/users`);
      console.log('✅ Users endpoint accessible');
      console.log(`   Found ${usersResponse.data.length} users`);
    } catch (error) {
      console.log('⚠️ Users endpoint requires authentication:', error.response?.status);
    }

    // Test 3: Try login with different credentials
    console.log('\n3. Testing login with different credentials...');
    
    const credentials = [
      { email: 'admin@cosmic.love', password: 'CosmicAdmin@2024' },
      { email: 'superadmin@cosmic.love', password: 'SuperCosmic@2024' },
      { email: 'support@cosmic.love', password: 'CosmicAdmin@2024' }
    ];

    for (const cred of credentials) {
      try {
        console.log(`   Trying ${cred.email}...`);
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, cred);
        console.log(`   ✅ Login successful for ${cred.email}`);
        console.log(`   User ID: ${loginResponse.data.user.id}`);
        console.log(`   Role: ${loginResponse.data.user.role}`);
        console.log(`   Token: ${loginResponse.data.access_token.substring(0, 20)}...`);
        break; // Stop after first successful login
      } catch (error) {
        console.log(`   ❌ Login failed for ${cred.email}: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running on http://192.168.86.8:3000');
    }
  }
}

testAPI();
