const path = require('path');

// Test the Netlify function locally
async function testNetlifyFunction() {
  console.log('🧪 Testing Netlify Function locally...');
  
  try {
    // Set up environment variables for testing
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-local-testing';
    
    // Import the function
    const functionPath = path.join(__dirname, '..', 'netlify', 'functions', 'api.js');
    console.log('📂 Loading function from:', functionPath);
    
    const { handler } = require(functionPath);
    console.log('✅ Function loaded successfully');
    
    // Create a test event
    const testEvent = {
      httpMethod: 'GET',
      path: '/api',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'test-agent'
      },
      body: null,
      queryStringParameters: null,
      isBase64Encoded: false
    };
    
    // Create a test context
    const testContext = {
      functionName: 'api',
      functionVersion: '1.0',
      memoryLimitInMB: 1024,
      getRemainingTimeInMillis: () => 30000,
      callbackWaitsForEmptyEventLoop: false
    };
    
    console.log('🚀 Invoking function...');
    const startTime = Date.now();
    
    const result = await handler(testEvent, testContext);
    
    const endTime = Date.now();
    console.log(`⏱️  Function executed in ${endTime - startTime}ms`);
    
    console.log('📊 Function result:');
    console.log('Status Code:', result.statusCode);
    console.log('Headers:', JSON.stringify(result.headers, null, 2));
    console.log('Body preview:', result.body ? result.body.substring(0, 200) + '...' : 'No body');
    
    if (result.statusCode === 200) {
      console.log('✅ Function executed successfully!');
      return true;
    } else {
      console.log('⚠️  Function returned non-200 status code');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Function test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
testNetlifyFunction()
  .then(success => {
    if (success) {
      console.log('🎉 Local function test completed successfully!');
      process.exit(0);
    } else {
      console.log('💥 Local function test failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error during test:', error);
    process.exit(1);
  });
