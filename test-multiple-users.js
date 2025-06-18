const { io } = require('socket.io-client');

console.log('🚀 Testing multiple users scenario...');

// Create multiple test users
const users = [
  { id: 'admin_user', name: 'Admin User', role: 'admin' },
  { id: 'user_alice', name: 'Alice Johnson', role: 'user' },
  { id: 'user_bob', name: 'Bob Smith', role: 'user' },
  { id: 'user_charlie', name: 'Charlie Brown', role: 'user' }
];

const sockets = new Map();

// Connect all users
users.forEach((user, index) => {
  setTimeout(() => {
    console.log(`🔌 Connecting ${user.name}...`);
    
    const socket = io('http://localhost:3002/chat', {
      auth: {
        userId: user.id,
        token: 'test_token'
      },
      transports: ['websocket', 'polling'],
    });
    
    socket.on('connect', () => {
      console.log(`✅ ${user.name} connected (${socket.id})`);
      sockets.set(user.id, socket);
      
      // Admin requests active users list
      if (user.role === 'admin') {
        setTimeout(() => {
          console.log('📋 Admin requesting active users...');
          socket.emit('get_active_users');
        }, 1000);
        
        // Admin sends chat invitation to Alice
        setTimeout(() => {
          console.log('💌 Admin sending chat invitation to Alice...');
          socket.emit('send_chat_invitation', {
            recipientId: 'user_alice',
            message: 'Hi Alice! Would you like to have a chat?'
          });
        }, 3000);
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error(`❌ ${user.name} connection error:`, error.message);
    });
    
    socket.on('active_users_list', (data) => {
      console.log(`👥 ${user.name} received active users: ${data.activeUsers.length} users`);
      data.activeUsers.forEach(u => {
        console.log(`  - ${u.fullName} (${u.id})`);
      });
    });
    
    socket.on('chat_invitation_sent', (data) => {
      console.log(`✉️ ${user.name} - invitation sent:`, data);
    });
    
    socket.on('chat_invitation_received', (invitation) => {
      console.log(`📨 ${user.name} received invitation from ${invitation.sender.fullName}`);
      console.log(`   Message: "${invitation.message}"`);
      
      // Alice accepts the invitation
      if (user.id === 'user_alice') {
        setTimeout(() => {
          console.log('✅ Alice accepting invitation...');
          socket.emit('accept_chat_invitation', { invitationId: invitation.id });
        }, 2000);
      }
    });
    
    socket.on('chat_invitation_accepted', (data) => {
      console.log(`🎉 ${user.name} - invitation accepted:`, data);
    });
    
    socket.on('new_message', (message) => {
      console.log(`💬 ${user.name} received message: "${message.content}"`);
    });
    
    socket.on('error', (error) => {
      console.error(`❌ ${user.name} error:`, error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log(`👋 ${user.name} disconnected:`, reason);
    });
    
  }, index * 1000); // Stagger connections
});

// Send a test message after invitation is accepted
setTimeout(() => {
  const adminSocket = sockets.get('admin_user');
  if (adminSocket) {
    console.log('💬 Admin sending test message to Alice...');
    adminSocket.emit('send_message', {
      recipientId: 'user_alice',
      content: 'Hello Alice! How are you today? 😊',
      type: 'TEXT'
    });
  }
}, 8000);

// Disconnect all users after 15 seconds
setTimeout(() => {
  console.log('🔌 Disconnecting all users...');
  sockets.forEach((socket, userId) => {
    socket.disconnect();
  });
  process.exit(0);
}, 15000);
