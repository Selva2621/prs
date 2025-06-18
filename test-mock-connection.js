const { io } = require('socket.io-client');

console.log('🚀 Testing mock server connection...');

// Test connection to mock server
const socket = io('http://localhost:3002/chat', {
  auth: {
    userId: 'test_admin',
    token: 'test_token'
  },
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('✅ Connected to mock server');
  console.log('Socket ID:', socket.id);
  
  // Test getting active users
  console.log('📋 Requesting active users...');
  socket.emit('get_active_users');
  
  // Test sending chat invitation
  setTimeout(() => {
    console.log('💌 Sending test chat invitation...');
    socket.emit('send_chat_invitation', {
      recipientId: 'test_user_2',
      message: 'Hello! Would you like to chat?'
    });
  }, 2000);
  
  // Disconnect after 5 seconds
  setTimeout(() => {
    console.log('🔌 Disconnecting...');
    socket.disconnect();
  }, 5000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

socket.on('active_users_list', (data) => {
  console.log('👥 Active users received:', data.activeUsers.length, 'users');
  data.activeUsers.forEach(user => {
    console.log(`  - ${user.fullName} (${user.id})`);
  });
});

socket.on('chat_invitation_sent', (data) => {
  console.log('✉️ Chat invitation sent:', data);
});

socket.on('chat_invitation_received', (invitation) => {
  console.log('📨 Chat invitation received:', invitation);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('👋 Disconnected:', reason);
  process.exit(0);
});
