const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// Map of projectId -> Set of online user objects
const activeProjectUsers = new Map();

function setupSockets(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error: Invalid token'));
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`User connected to socket: ${socket.user.name} (ID: ${socket.user.id})`);

    // Join personal user room for targeted notifications
    socket.join(`user:${socket.user.id}`);

    // Join project room
    socket.on('join_project', ({ projectId }) => {
      if (!projectId) return;
      const room = `project:${projectId}`;
      socket.join(room);

      if (!activeProjectUsers.has(projectId)) {
        activeProjectUsers.set(projectId, new Map());
      }
      const pUsers = activeProjectUsers.get(projectId);
      pUsers.set(socket.id, {
        id: socket.user.id,
        name: socket.user.name,
        email: socket.user.email
      });

      // Broadcast active user list to project room
      const onlineUsersList = Array.from(pUsers.values());
      io.to(room).emit('presence:update', { projectId, onlineUsers: onlineUsersList });
    });

    // Leave project room
    socket.on('leave_project', ({ projectId }) => {
      if (!projectId) return;
      const room = `project:${projectId}`;
      socket.leave(room);

      if (activeProjectUsers.has(projectId)) {
        const pUsers = activeProjectUsers.get(projectId);
        pUsers.delete(socket.id);
        const onlineUsersList = Array.from(pUsers.values());
        io.to(room).emit('presence:update', { projectId, onlineUsers: onlineUsersList });
      }
    });

    // Handle typing indicators for comments
    socket.on('typing:start', ({ projectId, taskId, userName }) => {
      socket.to(`project:${projectId}`).emit('typing:status', { taskId, userName, isTyping: true });
    });

    socket.on('typing:stop', ({ projectId, taskId, userName }) => {
      socket.to(`project:${projectId}`).emit('typing:status', { taskId, userName, isTyping: false });
    });

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room.startsWith('project:')) {
          const projectId = room.split(':')[1];
          if (activeProjectUsers.has(projectId)) {
            const pUsers = activeProjectUsers.get(projectId);
            pUsers.delete(socket.id);
            const onlineUsersList = Array.from(pUsers.values());
            io.to(`project:${projectId}`).emit('presence:update', { projectId, onlineUsers: onlineUsersList });
          }
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected from socket: ${socket.user.name}`);
    });
  });
}

module.exports = { setupSockets };
