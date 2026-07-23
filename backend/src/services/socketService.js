const { Server } = require('socket.io');

let io;

const initSockets = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User joins a specific ticket room to get live updates
    socket.on('join_ticket', (ticketId) => {
      socket.join(`ticket_${ticketId}`);
      console.log(`Socket ${socket.id} joined ticket_${ticketId}`);
    });

    socket.on('leave_ticket', (ticketId) => {
      socket.leave(`ticket_${ticketId}`);
      console.log(`Socket ${socket.id} left ticket_${ticketId}`);
    });

    // Typing indicator
    socket.on('typing', ({ ticketId, userName, isTyping }) => {
      socket.to(`ticket_${ticketId}`).emit('typing', { userName, isTyping });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

module.exports = { initSockets, getIo };
