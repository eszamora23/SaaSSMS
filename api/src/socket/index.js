/**
 * Socket.IO Setup
 * Real-time communication for messages and appointments
 */

const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/tokenGenerator');
const logger = require('../utils/logger');
const eventBus = require('../utils/eventBus');

/**
 * Initialize Socket.IO server
 */
const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
    path: '/socket.io/',
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify token
      const decoded = await verifyAccessToken(token);

      // Attach user info to socket
      socket.userId = decoded.userId;
      socket.orgId = decoded.orgId;
      socket.role = decoded.role;

      logger.debug('Socket authenticated', {
        socketId: socket.id,
        userId: decoded.userId,
        orgId: decoded.orgId,
      });

      next();
    } catch (error) {
      logger.error('Socket authentication failed', {
        error: error.message,
        socketId: socket.id,
      });
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info('Socket connected', {
      socketId: socket.id,
      userId: socket.userId,
      orgId: socket.orgId,
    });

    // Join organization room
    socket.join(`org:${socket.orgId}`);

    // Join user room
    socket.join(`user:${socket.userId}`);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', {
        socketId: socket.id,
        userId: socket.userId,
        reason,
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', {
        socketId: socket.id,
        userId: socket.userId,
        error: error.message,
      });
    });

    // Custom events
    socket.on('join:thread', (threadId) => {
      socket.join(`thread:${threadId}`);
      logger.debug('Socket joined thread', {
        socketId: socket.id,
        threadId,
      });
    });

    socket.on('leave:thread', (threadId) => {
      socket.leave(`thread:${threadId}`);
      logger.debug('Socket left thread', {
        socketId: socket.id,
        threadId,
      });
    });

    socket.on('join:appointment', (appointmentId) => {
      socket.join(`appointment:${appointmentId}`);
      logger.debug('Socket joined appointment', {
        socketId: socket.id,
        appointmentId,
      });
    });

    socket.on('leave:appointment', (appointmentId) => {
      socket.leave(`appointment:${appointmentId}`);
      logger.debug('Socket left appointment', {
        socketId: socket.id,
        appointmentId,
      });
    });

    // Typing indicators
    socket.on('typing:start', ({ threadId }) => {
      socket.to(`thread:${threadId}`).emit('user:typing', {
        userId: socket.userId,
        threadId,
      });
    });

    socket.on('typing:stop', ({ threadId }) => {
      socket.to(`thread:${threadId}`).emit('user:stopped_typing', {
        userId: socket.userId,
        threadId,
      });
    });
  });

  // Event bus listeners for real-time updates
  setupEventListeners(io);

  logger.info('Socket.IO initialized');

  return io;
};

/**
 * Setup event listeners to emit real-time updates
 */
const setupEventListeners = (io) => {
  // Message events
  eventBus.on('message.sent', (data) => {
    io.to(`org:${data.orgId}`).emit('message:sent', data.message);
    logger.debug('Emitted message:sent', { orgId: data.orgId });
  });

  eventBus.on('message.received', (data) => {
    io.to(`org:${data.orgId}`).emit('message:received', data.message);
    io.to(`thread:${data.threadId}`).emit('thread:new_message', data.message);
    logger.debug('Emitted message:received', { orgId: data.orgId });
  });

  eventBus.on('message.status_updated', (data) => {
    io.to(`org:${data.orgId}`).emit('message:status_updated', {
      messageId: data.messageId,
      status: data.status,
    });
  });

  // Appointment events
  eventBus.on('appointment.created', (data) => {
    io.to(`org:${data.orgId}`).emit('appointment:created', data.appointment);
    logger.debug('Emitted appointment:created', { orgId: data.orgId });
  });

  eventBus.on('appointment.rescheduled', (data) => {
    io.to(`org:${data.orgId}`).emit('appointment:rescheduled', data.appointment);
    io.to(`appointment:${data.appointment._id}`).emit('appointment:updated', data.appointment);
  });

  eventBus.on('appointment.canceled', (data) => {
    io.to(`org:${data.orgId}`).emit('appointment:canceled', data.appointment);
    io.to(`appointment:${data.appointment._id}`).emit('appointment:updated', data.appointment);
  });

  eventBus.on('appointment.confirmed', (data) => {
    io.to(`org:${data.orgId}`).emit('appointment:confirmed', data.appointment);
    io.to(`appointment:${data.appointment._id}`).emit('appointment:updated', data.appointment);
  });

  eventBus.on('appointment.completed', (data) => {
    io.to(`org:${data.orgId}`).emit('appointment:completed', data.appointment);
    io.to(`appointment:${data.appointment._id}`).emit('appointment:updated', data.appointment);
  });

  eventBus.on('appointment.no_show', (data) => {
    io.to(`org:${data.orgId}`).emit('appointment:no_show', data.appointment);
    io.to(`appointment:${data.appointment._id}`).emit('appointment:updated', data.appointment);
  });

  // Thread events
  eventBus.on('thread.assigned', (data) => {
    io.to(`org:${data.orgId}`).emit('thread:assigned', {
      threadId: data.threadId,
      assignedTo: data.assignedTo,
    });
    io.to(`user:${data.assignedTo}`).emit('thread:assigned_to_you', {
      threadId: data.threadId,
    });
  });

  // Customer events
  eventBus.on('customer.created', (data) => {
    io.to(`org:${data.orgId}`).emit('customer:created', data.customer);
  });

  eventBus.on('customer.updated', (data) => {
    io.to(`org:${data.orgId}`).emit('customer:updated', data.customer);
  });

  logger.info('Socket.IO event listeners setup complete');
};

module.exports = { initializeSocket };
