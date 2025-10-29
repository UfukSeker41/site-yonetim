// Announcement Worker - RabbitMQ Consumer
// Bu worker servisi announcement_queue'yu dinler ve gelen duyuruları veritabanına kaydeder
import dotenv from 'dotenv';
import { connectRabbitMQ, consumeAnnouncements, closeRabbitMQ } from '../config/rabbitmq.js';
import sequelize, { testConnection } from '../config/database.js';
import { Announcement } from '../models/index.js';

dotenv.config();

/**
 * Duyuruyu veritabanına kaydet
 */
const saveAnnouncementToDB = async (announcementData) => {
  try {
    // Duyuru zaten veritabanında var mı kontrol et
    const existing = await Announcement.findByPk(announcementData.id);
    
    if (existing) {
      console.log(`⚠️ Duyuru zaten mevcut: ID ${announcementData.id}`);
      return existing;
    }

    // Yeni duyuru oluştur
    const announcement = await Announcement.create({
      id: announcementData.id,
      title: announcementData.title,
      content: announcementData.content,
      authorId: announcementData.authorId,
      priority: announcementData.priority || 'medium',
      category: announcementData.category,
      expiresAt: announcementData.expiresAt
    });

    console.log(`💾 Duyuru veritabanına kaydedildi: ${announcement.title}`);
    return announcement;
  } catch (error) {
    console.error('❌ Veritabanı kayıt hatası:', error.message);
    throw error;
  }
};

/**
 * Eski duyuruları temizle (3 günden eski)
 */
const cleanupOldAnnouncements = async () => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const deleted = await Announcement.destroy({
      where: {
        createdAt: {
          [sequelize.Sequelize.Op.lt]: threeDaysAgo
        },
        expiresAt: {
          [sequelize.Sequelize.Op.not]: null
        }
      }
    });

    if (deleted > 0) {
      console.log(`🧹 ${deleted} eski duyuru temizlendi`);
    }
  } catch (error) {
    console.error('❌ Temizleme hatası:', error.message);
  }
};

/**
 * Worker başlat
 */
const startWorker = async () => {
  try {
    console.log('🚀 Announcement Worker başlatılıyor...');

    // Veritabanı bağlantısını test et
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Veritabanı bağlantısı başarısız');
    }

    // RabbitMQ bağlantısı kur
    await connectRabbitMQ();

    // Kuyruktan mesajları dinle ve işle
    await consumeAnnouncements(saveAnnouncementToDB);

    // Her gün bir kez eski duyuruları temizle
    setInterval(cleanupOldAnnouncements, 24 * 60 * 60 * 1000); // 24 saat

    console.log('✅ Worker başarıyla başlatıldı ve kuyruk dinleniyor...');
  } catch (error) {
    console.error('❌ Worker başlatma hatası:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️ Worker durduruluyor...');
  await closeRabbitMQ();
  await sequelize.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️ Worker durduruluyor...');
  await closeRabbitMQ();
  await sequelize.close();
  process.exit(0);
});

// Worker'ı başlat
startWorker().catch(error => {
  console.error('❌ Worker fatal hata:', error);
  process.exit(1);
});
