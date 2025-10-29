// Kullanıcı oluşturma scripti
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

async function createUsers() {
  // MySQL bağlantısı
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '_xPYaL6a',
    database: 'siteyonetim_db'
  });

  try {
    // Admin şifresi hash'le
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('admin123', 10);

    console.log('Admin Hash:', adminPassword);
    console.log('User Hash:', userPassword);

    // Admin kullanıcı ekle
    await connection.execute(`
      INSERT INTO users (username, email, password, full_name, role, apartment_number, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE password = VALUES(password)
    `, [
      'admin',
      'admin@siteyonetim.com',
      adminPassword,
      'Site Yöneticisi',
      'admin',
      'A-1',
      '+90 555 000 00 00'
    ]);

    console.log('✅ Admin kullanıcı eklendi/güncellendi');

    // Test kullanıcı ekle
    await connection.execute(`
      INSERT INTO users (username, email, password, full_name, role, apartment_number, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE password = VALUES(password)
    `, [
      'ahmet.yilmaz',
      'ahmet@example.com',
      userPassword,
      'Ahmet Yılmaz',
      'user',
      'B-5',
      '+90 555 111 11 11'
    ]);

    console.log('✅ Test kullanıcı eklendi/güncellendi');

    // Kullanıcıları listele
    const [users] = await connection.execute('SELECT id, username, email, full_name, role FROM users');
    console.log('\n📋 Veritabanındaki kullanıcılar:');
    console.table(users);

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await connection.end();
  }
}

createUsers();
