-- Bu SQL sorgularını MySQL Workbench'te çalıştırın
-- ŞİFRE: 121212 (tüm kullanıcılar için)

-- Önce mevcut kullanıcıları temizle (opsiyonel)
-- DELETE FROM users;

-- Admin kullanıcısı
-- Şifre: 121212
INSERT INTO users (username, email, password, full_name, role, apartment_number, phone, is_active)
VALUES (
    'admin',
    'admin@siteyonetim.com',
    '$2b$10$HrhujlU6fCzx6zjgKiJUEeeZEfsedOjhiTZtM6V884HwOmp966/56',
    'Site Yöneticisi',
    'admin',
    'A-1',
    '+90 555 000 00 00',
    1
) ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    email = VALUES(email);

-- Normal kullanıcı
-- Şifre: 121212
INSERT INTO users (username, email, password, full_name, role, apartment_number, phone, is_active)
VALUES (
    'ahmet.yilmaz',
    'ahmet@example.com',
    '$2b$10$jTqT5e6ngBkjMEM4C4jnAu2DnWPr/fBe/SdQ3lpyTf9nWwe7qzsdm',
    'Ahmet Yılmaz',
    'user',
    'B-5',
    '+90 555 111 11 11',
    1
) ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    email = VALUES(email);

-- Kullanıcıları kontrol et
SELECT id, username, email, full_name, role, apartment_number FROM users;
