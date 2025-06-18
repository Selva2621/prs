const { handler } = require('../netlify/functions/api');

async function testLocalFunction() {
  console.log('🧪 Testing Netlify function locally...');
  
  // Mock Netlify event for health check
  const mockEvent = {
    httpMethod: 'GET',
    path: '/health',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'test-agent'
    },
    body: null,
    queryStringParameters: null
  };

  // Mock Netlify context
  const mockContext = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'api',
    functionVersion: '1',
    memoryLimitInMB: 1024,
    requestId: 'test-request-id'
  };

  try {
    console.log('📡 Making request to /health endpoint...');
    const result = await handler(mockEvent, mockContext);
    
    console.log('✅ Function executed successfully!');
    console.log('Status Code:', result.statusCode);
    console.log('Headers:', result.headers);
    console.log('Body:', result.body);
    
    if (result.statusCode === 200) {
      console.log('🎉 Health check passed! The function is working correctly.');
    } else {
      console.log('⚠️ Unexpected status code:', result.statusCode);
    }
    
  } catch (error) {
    console.error('❌ Function test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testLocalFunction();
