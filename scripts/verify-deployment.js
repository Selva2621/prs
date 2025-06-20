const axios = require('axios');

const BASE_URL = process.argv[2] || 'http://localhost:3000';

async function testEndpoint(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);

    if (response.data) {
      console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
    }

    return true;
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log(`   Error details: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function verifyDeployment() {
  console.log(`🔍 Verifying deployment at: ${BASE_URL}`);
  console.log('='.repeat(50));

  const tests = [
    { endpoint: '/', method: 'GET' },
    { endpoint: '/api', method: 'GET' },
    { endpoint: '/health', method: 'GET' },
    { endpoint: '/auth/register', method: 'POST', data: { email: 'test@example.com', password: 'test123' } },
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    const success = await testEndpoint(test.endpoint, test.method, test.data);
    if (success) passed++;
    console.log('');
  }

  console.log('='.repeat(50));
  console.log(`📊 Test Results: ${passed}/${total} passed`);

  if (passed === total) {
    console.log('🎉 All tests passed! Deployment is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check your deployment configuration.');
  }
}

verifyDeployment().catch(console.error);
