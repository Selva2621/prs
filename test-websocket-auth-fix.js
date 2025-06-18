// Test WebSocket authentication after JWT configuration fix
const io = require('socket.io-client');
const axios = require('axios');

const API_BASE_URL = 'http://192.168.86.8:3000';
const WEBSOCKET_URL = 'http://192.168.86.8:3000/chat';

async function testWebSocketAuthFix() {
  console.log('🧪 Testing WebSocket Authentication Fix...\n');

  try {
    // Step 1: Login to get a valid JWT token
    console.log('1. Logging in to get JWT token...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@cosmic.love',
      password: 'admin123'
    });

    if (!loginResponse.data.access_token) {
      console.log('❌ Failed to get access token');
      return;
    }

    const token = loginResponse.data.access_token;
    const user = loginResponse.data.user;
    console.log(`✅ Login successful for ${user.fullName} (${user.role})`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Step 2: Test WebSocket connection with the token
    console.log('\n2. Testing WebSocket connection...');

    const socket = io(WEBSOCKET_URL, {
      auth: {
        token: token,
        userId: user.id
      },
      transports: ['websocket', 'polling'],
      timeout: 5000
    });

    // Set up event handlers
    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      console.log(`   Socket ID: ${socket.id}`);

      // Test the get_active_users functionality that was failing
      console.log('\n3. Testing get_active_users (previously failing)...');
      socket.emit('get_active_users');
    });

    socket.on('active_users_list', (data) => {
      console.log('✅ Active users list received successfully!');
      console.log(`   Found ${data.activeUsers.length} active users:`);
      data.activeUsers.forEach(user => {
        console.log(`   - ${user.fullName} (${user.email})`);
      });

      console.log('\n🎉 WebSocket authentication fix successful!');
      console.log('   The JWT configuration mismatch has been resolved.');

      socket.disconnect();
      process.exit(0);
    });

    socket.on('connect_error', (error) => {
      console.log('❌ WebSocket connection error:', error.message);
      process.exit(1);
    });

    socket.on('error', (error) => {
      console.log('❌ WebSocket error:', error);
      if (error.message === 'Not authenticated') {
        console.log('   This indicates the JWT configuration fix did not work');
        console.log('   The WebSocket module is still unable to verify the JWT token');
      }
      process.exit(1);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('❌ Test timed out');
      socket.disconnect();
      process.exit(1);
    }, 10000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testWebSocketAuthFix();
