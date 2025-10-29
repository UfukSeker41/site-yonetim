// Socket.IO Client Configuration
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket = null;

/**
 * Socket.IO bağlantısını başlat
 */
export const connectSocket = (token) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  // Bağlantı event'leri
  socket.on('connect', () => {
    console.log('✅ Socket.IO bağlantısı kuruldu:', socket.id);
  });

  socket.on('connected', (data) => {
    console.log('👋 Hoşgeldiniz:', data);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket.IO bağlantısı kesildi:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket.IO bağlantı hatası:', error.message);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket.IO hatası:', error);
  });

  return socket;
};

/**
 * Socket.IO bağlantısını kapat
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('👋 Socket.IO bağlantısı kapatıldı');
  }
};

/**
 * Aktif socket instance'ını al
 */
export const getSocket = () => {
  if (!socket || !socket.connected) {
    throw new Error('Socket.IO bağlantısı mevcut değil');
  }
  return socket;
};

/**
 * Event listener ekle
 */
export const onSocketEvent = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  }
};

/**
 * Event listener kaldır
 */
export const offSocketEvent = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
  }
};

/**
 * Event emit et
 */
export const emitSocketEvent = (event, data) => {
  if (socket?.connected) {
    socket.emit(event, data);
  } else {
    console.warn('Socket bağlantısı yok, event gönderilemedi:', event);
  }
};

// Toplantı event'leri
export const joinMeeting = (roomId) => {
  emitSocketEvent('meeting:join', roomId);
};

export const leaveMeeting = (roomId) => {
  emitSocketEvent('meeting:leave', roomId);
};

export const sendMessage = (roomId, content) => {
  emitSocketEvent('meeting:message', { roomId, content });
};

// WebRTC sinyalleri
export const sendOffer = (roomId, offer, to) => {
  emitSocketEvent('webrtc:offer', { roomId, offer, to });
};

export const sendAnswer = (roomId, answer, to) => {
  emitSocketEvent('webrtc:answer', { roomId, answer, to });
};

export const sendIceCandidate = (roomId, candidate, to) => {
  emitSocketEvent('webrtc:ice-candidate', { roomId, candidate, to });
};

export default {
  connectSocket,
  disconnectSocket,
  getSocket,
  onSocketEvent,
  offSocketEvent,
  emitSocketEvent,
  joinMeeting,
  leaveMeeting,
  sendMessage,
  sendOffer,
  sendAnswer,
  sendIceCandidate
};
