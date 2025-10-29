import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Re-attach all listeners
    this.listeners.forEach((handler, event) => {
      this.socket.on(event, handler);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, handler) {
    this.listeners.set(event, handler);
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event) {
    this.listeners.delete(event);
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  // Join a thread room
  joinThread(threadId) {
    this.emit('join:thread', threadId);
  }

  // Leave a thread room
  leaveThread(threadId) {
    this.emit('leave:thread', threadId);
  }

  // Join an appointment room
  joinAppointment(appointmentId) {
    this.emit('join:appointment', appointmentId);
  }

  // Leave an appointment room
  leaveAppointment(appointmentId) {
    this.emit('leave:appointment', appointmentId);
  }

  // Typing indicators
  startTyping(threadId) {
    this.emit('typing:start', { threadId });
  }

  stopTyping(threadId) {
    this.emit('typing:stop', { threadId });
  }
}

const socketService = new SocketService();

export default socketService;
