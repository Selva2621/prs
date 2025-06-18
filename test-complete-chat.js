const { io } = require('socket.io-client');

console.log('🚀 Testing complete chat flow...');

let adminSocket, aliceSocket;

// Connect Admin
console.log('🔌 Connecting Admin...');
adminSocket = io('http://localhost:3002/chat', {
  auth: { userId: 'admin_user', token: 'test_token' },
  transports: ['websocket', 'polling'],
});

adminSocket.on('connect', () => {
  console.log('✅ Admin connected');
  
  // Connect Alice after admin
  setTimeout(() => {
    console.log('🔌 Connecting Alice...');
    aliceSocket = io('http://localhost:3002/chat', {
      auth: { userId: 'user_alice', token: 'test_token' },
      transports: ['websocket', 'polling'],
    });
    
    aliceSocket.on('connect', () => {
      console.log('✅ Alice connected');
      
      // Admin gets active users
      setTimeout(() => {
        console.log('📋 Admin requesting active users...');
        adminSocket.emit('get_active_users');
      }, 1000);
      
      // Admin sends invitation
      setTimeout(() => {
        console.log('💌 Admin sending chat invitation...');
        adminSocket.emit('send_chat_invitation', {
          recipientId: 'user_alice',
          message: 'Hi Alice! Would you like to chat?'
        });
      }, 2000);
    });
    
    // Alice receives invitation
    aliceSocket.on('chat_invitation_received', (invitation) => {
      console.log('📨 Alice received invitation:', invitation.message);
      
      // Alice accepts
      setTimeout(() => {
        console.log('✅ Alice accepting invitation...');
        aliceSocket.emit('accept_chat_invitation', { invitationId: invitation.id });
      }, 1000);
    });
    
    // Alice joins room after accepting
    aliceSocket.on('chat_invitation_accepted', (data) => {
      console.log('🎉 Alice - invitation accepted');
      
      // Both join the chat room
      setTimeout(() => {
        console.log('🏠 Both users joining chat room...');
        adminSocket.emit('join_room', { recipientId: 'user_alice' });
        aliceSocket.emit('join_room', { recipientId: 'admin_user' });
      }, 500);
    });
    
    // Room joined events
    adminSocket.on('room_joined', (data) => {
      console.log('🏠 Admin joined room:', data.roomId);
      
      // Start conversation
      setTimeout(() => {
        console.log('💬 Admin sending first message...');
        adminSocket.emit('send_message', {
          recipientId: 'user_alice',
          content: 'Hello Alice! How are you today?',
          type: 'TEXT'
        });
      }, 1000);
    });
    
    aliceSocket.on('room_joined', (data) => {
      console.log('🏠 Alice joined room:', data.roomId);
    });
    
    // Message events
    adminSocket.on('new_message', (message) => {
      console.log(`💬 Admin received: "${message.content}"`);
    });
    
    aliceSocket.on('new_message', (message) => {
      console.log(`💬 Alice received: "${message.content}"`);
      
      // Alice replies
      if (message.senderId === 'admin_user') {
        setTimeout(() => {
          console.log('💬 Alice replying...');
          aliceSocket.emit('send_message', {
            recipientId: 'admin_user',
            content: 'Hi! I\'m doing great, thanks for asking! 😊',
            type: 'TEXT'
          });
        }, 2000);
      }
    });
    
    // Typing indicators
    adminSocket.on('user_typing', (data) => {
      console.log(`⌨️ Admin sees: ${data.user.fullName} is ${data.isTyping ? 'typing' : 'stopped typing'}`);
    });
    
    aliceSocket.on('user_typing', (data) => {
      console.log(`⌨️ Alice sees: ${data.user.fullName} is ${data.isTyping ? 'typing' : 'stopped typing'}`);
    });
    
  }, 1000);
});

// Admin events
adminSocket.on('active_users_list', (data) => {
  console.log(`👥 Admin sees ${data.activeUsers.length} active users:`);
  data.activeUsers.forEach(user => {
    console.log(`  - ${user.fullName} (${user.id})`);
  });
});

adminSocket.on('chat_invitation_sent', (data) => {
  console.log('✉️ Admin - invitation sent successfully');
});

// Test typing indicators
setTimeout(() => {
  if (aliceSocket && aliceSocket.connected) {
    console.log('⌨️ Alice starts typing...');
    aliceSocket.emit('typing', { recipientId: 'admin_user', isTyping: true });
    
    setTimeout(() => {
      console.log('⌨️ Alice stops typing...');
      aliceSocket.emit('typing', { recipientId: 'admin_user', isTyping: false });
    }, 3000);
  }
}, 8000);

// Cleanup
setTimeout(() => {
  console.log('🔌 Disconnecting all users...');
  if (adminSocket) adminSocket.disconnect();
  if (aliceSocket) aliceSocket.disconnect();
  process.exit(0);
}, 15000);
