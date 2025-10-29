import { hashSync } from 'bcrypt';

// Şifrelerinizi buraya yazın
const passwords = {
  admin: '121212',
  user: '121212'
};

console.log('='.repeat(60));
console.log('ŞIFRE HASH\'LERİ');
console.log('='.repeat(60));

for (const [user, password] of Object.entries(passwords)) {
  const hash = hashSync(password, 10);
  console.log(`\n${user.toUpperCase()}:`);
  console.log(`Şifre: ${password}`);
  console.log(`Hash: ${hash}`);
}

console.log('\n' + '='.repeat(60));
console.log('SQL SORGUSU (MySQL Workbench\'te çalıştırın):');
console.log('='.repeat(60));

const adminHash = hashSync(passwords.admin, 10);
const userHash = hashSync(passwords.user, 10);

console.log(`
-- Admin kullanıcısı şifresini güncelle (Şifre: 121212)
UPDATE users SET password = '${adminHash}' WHERE username = 'admin';

-- Test kullanıcısı şifresini güncelle (Şifre: 121212)  
UPDATE users SET password = '${userHash}' WHERE username = 'ahmet.yilmaz';

-- Kontrol et
SELECT username, email, role FROM users;
`);
