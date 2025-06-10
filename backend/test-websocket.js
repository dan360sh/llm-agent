const io = require('socket.io-client');

console.log('Connecting to WebSocket...');

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ WebSocket connected:', socket.id);
  
  // Присоединяемся к чату
  const chatId = '81d274a4-d878-4228-b45d-e69d67dc7174';
  socket.emit('join-chat', chatId);
  console.log('📥 Joined chat:', chatId);
  
  // Отправляем тестовое сообщение через 1 секунду
  setTimeout(() => {
    console.log('📤 Sending test message...');
    socket.emit('send-message', {
      chatId: chatId,
      content: 'Тестовое сообщение из Node.js',
      images: []
    });
  }, 1000);
});

socket.on('disconnect', (reason) => {
  console.log('❌ WebSocket disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});

socket.on('stream-response', (data) => {
  console.log('📨 Stream response:', data);
});

socket.on('generation-start', (data) => {
  console.log('🚀 Generation started:', data);
});

socket.on('generation-complete', (data) => {
  console.log('✅ Generation completed:', data);
  process.exit(0);
});

socket.on('generation-error', (data) => {
  console.error('❌ Generation error:', data);
  process.exit(1);
});

// Завершаем через 30 секунд
setTimeout(() => {
  console.log('⏰ Test timeout');
  process.exit(0);
}, 30000);
