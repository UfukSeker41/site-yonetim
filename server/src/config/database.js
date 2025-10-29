// Database Configuration - Sequelize ORM
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// MySQL bağlantı ayarları
const sequelize = new Sequelize(
  process.env.DB_NAME || 'siteyonetim_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+03:00', // Türkiye saat dilimi
    define: {
      timestamps: true,
      underscored: true, // snake_case yerine camelCase kullan
      freezeTableName: true // Tablo isimlerini otomatik çoğul yapma
    }
  }
);

// Veritabanı bağlantısını test et
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL veritabanı bağlantısı başarılı!');
    return true;
  } catch (error) {
    console.error('❌ MySQL bağlantı hatası:', error.message);
    return false;
  }
};

// Tabloları senkronize et (geliştirme ortamı için)
export const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force, alter: true });
    console.log(`✅ Veritabanı tabloları ${force ? 'yeniden oluşturuldu' : 'senkronize edildi'}!`);
  } catch (error) {
    console.error('❌ Veritabanı senkronizasyon hatası:', error.message);
    throw error;
  }
};

export default sequelize;
