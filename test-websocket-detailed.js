const io = require('socket.io-client');
const axios = require('axios');

const WEBSOCKET_URL = 'http://192.168.86.8:3000/chat';
const API_BASE_URL = 'http://192.168.86.8:3000';

async function testWebSocketDetailed() {
  console.log('🔌 Testing WebSocket Connection (Detailed)...\n');

  try {
    // Get authentication token
    console.log('1. Getting authentication token...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'superadmin@cosmic.love',
      password: 'SuperCosmic@2024'
    });
    
    const loginData = loginResponse.data;
    console.log('✅ Login successful');
    console.log('   User ID:', loginData.user.id);
    console.log('   Email:', loginData.user.email);
    console.log('   Token length:', loginData.access_token.length);
    console.log('   Token preview:', loginData.access_token.substring(0, 50) + '...');

    // Test WebSocket connection with detailed logging
    console.log('\n2. Testing WebSocket connection...');
    
    const socket = io(WEBSOCKET_URL, {
      auth: {
        token: loginData.access_token,
        userId: loginData.user.id
      },
      transports: ['websocket', 'polling'],
      timeout: 10000
    });

    // Connection events
    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      console.log('   Socket ID:', socket.id);
      console.log('   Transport:', socket.io.engine.transport.name);
      
      // Wait a moment then request active users
      setTimeout(() => {
        console.log('\n3. Requesting active users...');
        socket.emit('get_active_users');
      }, 1000);
    });

    socket.on('connect_error', (error) => {
      console.log('❌ WebSocket connection error:', error.message);
      console.log('   Error details:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
    });

    // Response events
    socket.on('active_users_list', (data) => {
      console.log(`📋 Received active users list: ${data.activeUsers.length} users`);
      data.activeUsers.forEach(user => {
        console.log(`   - ${user.fullName} (${user.id})`);
      });
      
      console.log('\n✅ All tests passed!');
      socket.disconnect();
      process.exit(0);
    });

    socket.on('error', (error) => {
      console.log('❌ WebSocket error:', error);
      console.log('   Error type:', typeof error);
      console.log('   Error details:', JSON.stringify(error, null, 2));
    });

    // User events
    socket.on('user_online', (data) => {
      console.log('👤 User came online:', data.user.fullName);
    });

    socket.on('user_offline', (data) => {
      console.log('👤 User went offline:', data.userId);
    });

    // Timeout after 15 seconds
    setTimeout(() => {
      console.log('⏰ Test timeout - disconnecting');
      socket.disconnect();
      process.exit(1);
    }, 15000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    process.exit(1);
  }
}

testWebSocketDetailed();
