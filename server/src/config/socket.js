// Socket.IO Configuration and Event Handlers
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User, Meeting, Message } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'siteyonetim-secret-key-2025';

let io = null;

/**
 * Socket.IO sunucusunu başlat
 */
export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token gerekli'));
      }

      // Token'ı doğrula
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.userId);

      if (!user || !user.isActive) {
        return next(new Error('Kullanıcı bulunamadı veya devre dışı'));
      }

      // Socket'e kullanıcı bilgilerini ekle
      socket.userId = user.id;
      socket.username = user.username;
      socket.role = user.role;
      socket.fullName = user.fullName;

      next();
    } catch (error) {
      next(new Error('Token doğrulama hatası: ' + error.message));
    }
  });

  // Bağlantı kurulduğunda
  io.on('connection', (socket) => {
    console.log(`🔌 Kullanıcı bağlandı: ${socket.fullName} (${socket.username})`);

    // Kullanıcıyı kendi odasına ekle
    socket.join(`user:${socket.userId}`);

    // Kullanıcıya hoşgeldin mesajı gönder
    socket.emit('connected', {
      message: 'Socket.IO bağlantısı başarılı',
      userId: socket.userId,
      username: socket.username,
      role: socket.role
    });

    // Yeni duyuru oluşturuldu (admin tarafından)
    socket.on('announcement:create', async (data) => {
      if (socket.role !== 'admin') {
        socket.emit('error', { message: 'Yetkiniz yok' });
        return;
      }

      try {
        // Tüm kullanıcılara yeni duyuruyu bildir
        io.emit('announcement:new', {
          id: data.id,
          title: data.title,
          content: data.content,
          priority: data.priority,
          createdAt: data.createdAt,
          author: {
            id: socket.userId,
            fullName: socket.fullName
          }
        });

        console.log(`📢 Yeni duyuru yayınlandı: ${data.title}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Toplantıya katıl
    socket.on('meeting:join', async (roomId) => {
      try {
        const meeting = await Meeting.findOne({ where: { roomId } });

        if (!meeting) {
          socket.emit('error', { message: 'Toplantı bulunamadı' });
          return;
        }

        if (meeting.status !== 'ongoing' && meeting.status !== 'scheduled') {
          socket.emit('error', { message: 'Toplantı aktif değil' });
          return;
        }

        // Toplantı odasına katıl
        socket.join(`meeting:${roomId}`);
        socket.currentMeeting = roomId;

        // Toplantıya katılan kullanıcıları bildir
        io.to(`meeting:${roomId}`).emit('meeting:user-joined', {
          userId: socket.userId,
          username: socket.username,
          fullName: socket.fullName,
          timestamp: new Date()
        });

        // Odadaki tüm katılımcıları al
        const room = io.sockets.adapter.rooms.get(`meeting:${roomId}`);
        const participants = [];
        
        if (room) {
          for (const socketId of room) {
            const roomSocket = io.sockets.sockets.get(socketId);
            if (roomSocket) {
              participants.push({
                userId: roomSocket.userId,
                username: roomSocket.username,
                fullName: roomSocket.fullName
              });
            }
          }
        }

        // Katılan kullanıcıya toplantı bilgilerini ve katılımcıları gönder
        socket.emit('meeting:joined', {
          roomId,
          meetingId: meeting.id,
          title: meeting.title,
          hostId: meeting.hostId,
          participants: participants
        });

        console.log(`👥 ${socket.fullName} toplantıya katıldı: ${roomId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Toplantıdan ayrıl
    socket.on('meeting:leave', (roomId) => {
      if (socket.currentMeeting === roomId) {
        socket.leave(`meeting:${roomId}`);
        socket.currentMeeting = null;

        // Diğer kullanıcılara bildir
        io.to(`meeting:${roomId}`).emit('meeting:user-left', {
          userId: socket.userId,
          username: socket.username,
          fullName: socket.fullName,
          timestamp: new Date()
        });

        console.log(`👋 ${socket.fullName} toplantıdan ayrıldı: ${roomId}`);
      }
    });

    // Toplantıda mesaj gönder
    socket.on('meeting:message', async ({ roomId, content }) => {
      try {
        const meeting = await Meeting.findOne({ where: { roomId } });

        if (!meeting) {
          socket.emit('error', { message: 'Toplantı bulunamadı' });
          return;
        }

        // Mesajı veritabanına kaydet
        const message = await Message.create({
          meetingId: meeting.id,
          userId: socket.userId,
          content,
          messageType: 'text'
        });

        // Toplantıdaki tüm kullanıcılara mesajı gönder
        io.to(`meeting:${roomId}`).emit('meeting:message', {
          id: message.id,
          content: message.content,
          userId: socket.userId,
          username: socket.username,
          fullName: socket.fullName,
          timestamp: message.createdAt
        });

        console.log(`💬 Mesaj gönderildi: ${socket.fullName} -> ${roomId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Video chat sinyalleri (WebRTC için)
    socket.on('webrtc:offer', ({ roomId, offer, to }) => {
      console.log(`📤 WebRTC Offer alındı - from: ${socket.userId}, to: ${to}`);
      // Eğer 'to' varsa sadece o kullanıcıya gönder
      if (to) {
        const userSocket = Array.from(io.sockets.sockets.values()).find(s => s.userId === to);
        if (userSocket) {
          console.log(`✅ Offer gönderiliyor (${socket.userId} -> ${to})`);
          userSocket.emit('webrtc:offer', {
            offer,
            from: socket.userId,
            fromName: socket.fullName
          });
        } else {
          console.log(`❌ Hedef kullanıcı bulunamadı: ${to}`);
        }
      } else {
        // Yoksa odada herkese yayın (fallback)
        console.log(`📢 Offer odaya yayınlanıyor (fallback)`);
        socket.to(`meeting:${roomId}`).emit('webrtc:offer', {
          offer,
          from: socket.userId,
          fromName: socket.fullName
        });
      }
    });

    socket.on('webrtc:answer', ({ roomId, answer, to }) => {
      console.log(`📥 WebRTC Answer alındı - from: ${socket.userId}, to: ${to}`);
      // Eğer 'to' varsa sadece o kullanıcıya gönder
      if (to) {
        const userSocket = Array.from(io.sockets.sockets.values()).find(s => s.userId === to);
        if (userSocket) {
          console.log(`✅ Answer gönderiliyor (${socket.userId} -> ${to})`);
          userSocket.emit('webrtc:answer', {
            answer,
            from: socket.userId,
            fromName: socket.fullName
          });
        } else {
          console.log(`❌ Hedef kullanıcı bulunamadı: ${to}`);
        }
      } else {
        // Yoksa odada herkese yayın (fallback)
        console.log(`📢 Answer odaya yayınlanıyor (fallback)`);
        socket.to(`meeting:${roomId}`).emit('webrtc:answer', {
          answer,
          from: socket.userId,
          fromName: socket.fullName
        });
      }
    });

    socket.on('webrtc:ice-candidate', ({ roomId, candidate, to }) => {
      // Eğer 'to' varsa sadece o kullanıcıya gönder
      if (to) {
        const userSocket = Array.from(io.sockets.sockets.values()).find(s => s.userId === to);
        if (userSocket) {
          userSocket.emit('webrtc:ice-candidate', {
            candidate,
            from: socket.userId
          });
        }
      } else {
        // Yoksa odada herkese yayın (fallback)
        socket.to(`meeting:${roomId}`).emit('webrtc:ice-candidate', {
          candidate,
          from: socket.userId
        });
      }
    });

    // Bağlantı koptuğunda
    socket.on('disconnect', () => {
      console.log(`❌ Kullanıcı bağlantısı kesildi: ${socket.fullName}`);

      // Eğer bir toplantıdaysa, diğer kullanıcılara bildir
      if (socket.currentMeeting) {
        io.to(`meeting:${socket.currentMeeting}`).emit('meeting:user-left', {
          userId: socket.userId,
          username: socket.username,
          fullName: socket.fullName,
          timestamp: new Date()
        });
      }
    });
  });

  console.log('✅ Socket.IO sunucusu başlatıldı');
  return io;
};

/**
 * Socket.IO instance'ını al
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO henüz başlatılmadı');
  }
  return io;
};

/**
 * Belirli bir kullanıcıya mesaj gönder
 */
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Tüm kullanıcılara mesaj gönder
 */
export const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

/**
 * Belirli bir toplantı odasına mesaj gönder
 */
export const emitToMeeting = (roomId, event, data) => {
  if (io) {
    io.to(`meeting:${roomId}`).emit(event, data);
  }
};

export default {
  initializeSocket,
  getIO,
  emitToUser,
  emitToAll,
  emitToMeeting
};
