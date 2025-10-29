// RabbitMQ Configuration and Connection
import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const ANNOUNCEMENT_QUEUE = 'announcement_queue';

let connection = null;
let channel = null;

/**
 * RabbitMQ bağlantısı kur
 */
export const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Announcement kuyruğunu oluştur (durable: true - kalıcı)
    await channel.assertQueue(ANNOUNCEMENT_QUEUE, {
      durable: true, // Sunucu yeniden başlatıldığında kuyruk korunur
      messageTtl: 259200000 // 3 gün (milisaniye cinsinden)
    });

    console.log('✅ RabbitMQ bağlantısı başarılı!');
    console.log(`📬 Kuyruk: ${ANNOUNCEMENT_QUEUE}`);

    // Bağlantı kapandığında yeniden bağlan
    connection.on('close', () => {
      console.log('⚠️ RabbitMQ bağlantısı kapandı, yeniden bağlanılıyor...');
      setTimeout(connectRabbitMQ, 5000);
    });

    connection.on('error', (err) => {
      console.error('❌ RabbitMQ bağlantı hatası:', err.message);
    });

    return { connection, channel };
  } catch (error) {
    console.error('❌ RabbitMQ bağlantı hatası:', error.message);
    // 5 saniye sonra tekrar dene
    setTimeout(connectRabbitMQ, 5000);
    throw error;
  }
};

/**
 * Duyuru mesajını kuyruğa gönder (Publisher)
 */
export const publishAnnouncement = async (announcement) => {
  try {
    if (!channel) {
      throw new Error('RabbitMQ channel mevcut değil');
    }

    const message = JSON.stringify({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      authorId: announcement.authorId,
      priority: announcement.priority,
      category: announcement.category,
      expiresAt: announcement.expiresAt,
      timestamp: new Date().toISOString()
    });

    // Mesajı kuyruğa gönder (persistent: true - kalıcı mesaj)
    const sent = channel.sendToQueue(
      ANNOUNCEMENT_QUEUE,
      Buffer.from(message),
      {
        persistent: true, // Mesaj disk'e yazılır
        contentType: 'application/json',
        timestamp: Date.now()
      }
    );

    if (sent) {
      console.log(`📤 Duyuru kuyruğa eklendi: ${announcement.title}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ RabbitMQ publish hatası:', error.message);
    throw error;
  }
};

/**
 * Kuyruktan mesaj tüket (Consumer)
 */
export const consumeAnnouncements = async (callback) => {
  try {
    if (!channel) {
      throw new Error('RabbitMQ channel mevcut değil');
    }

    // Aynı anda sadece 1 mesaj işle (prefetch)
    channel.prefetch(1);

    console.log(`📥 ${ANNOUNCEMENT_QUEUE} kuyruğu dinleniyor...`);

    // Mesajları tüket
    channel.consume(
      ANNOUNCEMENT_QUEUE,
      async (msg) => {
        if (msg) {
          try {
            const announcementData = JSON.parse(msg.content.toString());
            console.log(`📩 Yeni duyuru alındı: ${announcementData.title}`);

            // Callback fonksiyonunu çağır (veritabanına kaydet)
            await callback(announcementData);

            // Mesajı onayla (acknowledge)
            channel.ack(msg);
            console.log('✅ Mesaj işlendi ve onaylandı');
          } catch (error) {
            console.error('❌ Mesaj işleme hatası:', error.message);
            // Hata durumunda mesajı reddet ve tekrar kuyruğa gönder
            channel.nack(msg, false, true);
          }
        }
      },
      {
        noAck: false // Manuel onay modu
      }
    );
  } catch (error) {
    console.error('❌ RabbitMQ consume hatası:', error.message);
    throw error;
  }
};

/**
 * Bağlantıyı kapat
 */
export const closeRabbitMQ = async () => {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
    console.log('👋 RabbitMQ bağlantısı kapatıldı');
  } catch (error) {
    console.error('❌ RabbitMQ kapatma hatası:', error.message);
  }
};

export { ANNOUNCEMENT_QUEUE };

export default {
  connectRabbitMQ,
  publishAnnouncement,
  consumeAnnouncements,
  closeRabbitMQ,
  ANNOUNCEMENT_QUEUE
};
