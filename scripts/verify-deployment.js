const axios = require('axios');

async function verifyDeployment(baseUrl) {
  console.log('🔍 Verifying Cosmic Love API deployment...\n');
  
  try {
    // Test basic health endpoint
    console.log('1. Testing basic health endpoint...');
    const healthResponse = await axios.get(`${baseUrl}/`);
    console.log(`✅ Health check: ${healthResponse.status} - ${healthResponse.data}`);
    
    // Test API documentation
    console.log('\n2. Testing API documentation...');
    const docsResponse = await axios.get(`${baseUrl}/api`);
    console.log(`✅ API docs: ${docsResponse.status} - Swagger UI loaded`);
    
    // Test a protected endpoint (should return 401)
    console.log('\n3. Testing protected endpoint...');
    try {
      await axios.get(`${baseUrl}/users/profile`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`✅ Protected endpoint: ${error.response.status} - Correctly requires authentication`);
      } else {
        throw error;
      }
    }
    
    console.log('\n🎉 Deployment verification completed successfully!');
    console.log(`🌐 Your API is live at: ${baseUrl}`);
    console.log(`📚 API Documentation: ${baseUrl}/api`);
    
  } catch (error) {
    console.error('\n❌ Deployment verification failed:');
    console.error(error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  }
}

// Get URL from command line argument or use default
const url = process.argv[2] || 'http://localhost:3000';
verifyDeployment(url);
