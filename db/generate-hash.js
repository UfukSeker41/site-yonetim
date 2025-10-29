// Şifre hash'i oluşturma scripti
const bcrypt = require('bcrypt');

async function generateHash() {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Şifre:', password);
    console.log('Bcrypt Hash:', hash);
    console.log('\nSQL için hazır INSERT sorgusu:');
    console.log(`
INSERT INTO users (username, email, password, full_name, role, apartment_number, phone)
VALUES (
    'admin',
    'admin@siteyonetim.com',
    '${hash}',
    'Site Yöneticisi',
    'admin',
    'A-1',
    '+90 555 000 00 00'
) ON DUPLICATE KEY UPDATE email=email;
    `);
}

generateHash();
