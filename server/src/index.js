// Main Server File - Express + Socket.IO + RabbitMQ
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Configuration
import sequelize, { testConnection, syncDatabase } from './config/database.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import { initializeSocket } from './config/socket.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Express app oluştur
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet()); // Güvenlik header'ları
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json()); // JSON body parser
app.use(express.urlencoded({ extended: true })); // URL encoded body parser

// Logging (sadece development ortamında)
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/users', userRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı',
    path: req.originalUrl
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Sunucu hatası',
    error: NODE_ENV === 'development' ? err.stack : undefined
  });
});

/**
 * Server'ı başlat
 */
const startServer = async () => {
  try {
    console.log('🚀 Site Yönetim Sistemi başlatılıyor...');
    console.log(`📍 Ortam: ${NODE_ENV}`);

    // 1. Veritabanı bağlantısını test et
    console.log('\n📊 MySQL bağlantısı test ediliyor...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      throw new Error('Veritabanı bağlantısı başarısız!');
    }

    // 2. Veritabanı tablolarını senkronize et
    console.log('🔄 Veritabanı tabloları senkronize ediliyor...');
    await syncDatabase(false); // false = mevcut tabloları silme

    // 3. RabbitMQ bağlantısını kur
    console.log('\n🐰 RabbitMQ bağlantısı kuruluyor...');
    try {
      await connectRabbitMQ();
    } catch (rabbitError) {
      console.warn('⚠️ RabbitMQ bağlantısı başarısız, devam ediliyor...');
      console.warn('Mesaj: RabbitMQ servisi çalışmıyor olabilir');
    }

    // 4. Socket.IO'yu başlat
    console.log('\n🔌 Socket.IO başlatılıyor...');
    initializeSocket(httpServer);

    // 5. HTTP Server'ı başlat
    httpServer.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log(`✅ Server başarıyla başlatıldı!`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔐 API Base: http://localhost:${PORT}/api`);
      console.log('='.repeat(50) + '\n');
    });

  } catch (error) {
    console.error('\n❌ Server başlatma hatası:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Graceful Shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n⏹️ ${signal} sinyali alındı, server kapatılıyor...`);
  
  // HTTP server'ı kapat
  httpServer.close(async () => {
    console.log('👋 HTTP server kapatıldı');
    
    // Veritabanı bağlantısını kapat
    try {
      await sequelize.close();
      console.log('💾 Veritabanı bağlantısı kapatıldı');
    } catch (error) {
      console.error('❌ Veritabanı kapatma hatası:', error.message);
    }

    console.log('✅ Tüm bağlantılar güvenli şekilde kapatıldı');
    process.exit(0);
  });

  // 10 saniye içinde kapanmazsa zorla kapat
  setTimeout(() => {
    console.error('⚠️ Zaman aşımı, zorla kapatılıyor...');
    process.exit(1);
  }, 10000);
};

// Process event listeners
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Server'ı başlat
startServer();

export default app;
