const io = require('socket.io-client');

const WEBSOCKET_URL = 'http://192.168.86.8:3000/chat';
const API_BASE_URL = 'http://192.168.86.8:3000';

async function testWebSocketConnection() {
  console.log('🔌 Testing WebSocket Connection...\n');

  // First, let's get a real token by logging in
  console.log('1. Getting authentication token...');

  try {
    // Use axios which should be available
    const axios = require('axios');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'superadmin@cosmic.love',
      password: 'SuperCosmic@2024'
    });

    const loginData = loginResponse.data;

    if (!loginData.access_token) {
      console.log('❌ Login failed:', loginData);
      return;
    }

    console.log('✅ Login successful');
    console.log('   User ID:', loginData.user.id);
    console.log('   Email:', loginData.user.email);

    // Now test WebSocket connection
    console.log('\n2. Testing WebSocket connection...');

    const socket = io(WEBSOCKET_URL, {
      auth: {
        token: loginData.access_token,
        userId: loginData.user.id
      },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      console.log('   Socket ID:', socket.id);

      // Request active users
      console.log('\n3. Requesting active users...');
      socket.emit('get_active_users');
    });

    socket.on('active_users_list', (data) => {
      console.log(`📋 Received active users list: ${data.activeUsers.length} users`);
      data.activeUsers.forEach(user => {
        console.log(`   - ${user.fullName} (${user.id})`);
      });

      // Test completed successfully
      console.log('\n✅ All tests passed!');
      socket.disconnect();
      process.exit(0);
    });

    socket.on('connect_error', (error) => {
      console.log('❌ WebSocket connection error:', error.message);
      process.exit(1);
    });

    socket.on('error', (error) => {
      console.log('❌ WebSocket error:', error);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('⏰ Test timeout - disconnecting');
      socket.disconnect();
      process.exit(1);
    }, 10000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testWebSocketConnection();
