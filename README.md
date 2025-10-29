# 🏢 Site Yönetim Sistemi - Fullstack Toplantı ve Duyuru Platformu

**Node.js + Express + React + Socket.IO + RabbitMQ + MySQL**

Modern ve kullanıcı dostu site yönetimi için gerçek zamanlı toplantı ve duyuru sistemi.

---

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Sistem Mimarisi](#-sistem-mimarisi)
- [Kurulum](#-kurulum)
- [Kullanım](#-kullanım)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [Proje Yapısı](#-proje-yapısı)

---

## ✨ Özellikler

### 🔐 Kimlik Doğrulama
- **JWT tabanlı güvenli giriş sistemi**
- Yönetici tarafından kullanıcı ekleme (kayıt sistemi yok)
- Rol tabanlı yetkilendirme (Admin/User)

### 📢 Duyuru Yönetimi
- Gerçek zamanlı duyuru bildirimleri (Socket.IO)
- Öncelik seviyelerine göre duyurular (Acil, Yüksek, Orta, Düşük)
- RabbitMQ ile 3 gün mesaj saklama garantisi
- Kategori bazlı filtreleme

### 🎥 Toplantı Sistemi
- **Video toplantı** ve **Chat toplantısı** desteği
- Gerçek zamanlı mesajlaşma
- WebRTC placeholder (video chat için hazır altyapı)
- Toplantı planlama ve yönetimi
- Katılımcı takibi

### 👥 Kullanıcı Yönetimi (Admin)
- Yeni site sakini ekleme
- Kullanıcı düzenleme ve silme
- Daire bilgileri yönetimi

### 📊 Dashboard
- İstatistikler ve özet bilgiler
- Son duyurular
- Yaklaşan toplantılar
- Hızlı işlem butonları (Admin)

---

## 🛠 Teknoloji Yığını

### Backend
- **Node.js** v18+
- **Express.js** - Web framework
- **Socket.IO** - Gerçek zamanlı iletişim
- **RabbitMQ** - Mesaj kuyruğu yönetimi
- **MySQL** - İlişkisel veritabanı
- **Sequelize** - ORM
- **JWT** - Kimlik doğrulama
- **Bcrypt** - Şifre hashleme

### Frontend
- **React** 18
- **Vite** - Build tool
- **React Router** - Routing
- **Socket.IO Client** - WebSocket bağlantısı
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icon library

### Infrastructure
- **RabbitMQ** - Message broker
- **MySQL** 8+ - Database

---

## 🏗 Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────────┐
│                          REACT FRONTEND                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │   Login     │  │  Dashboard   │  │   Meeting Room      │    │
│  │   Page      │  │  & Announce  │  │   (Socket.IO)       │    │
│  └─────────────┘  └──────────────┘  └─────────────────────┘    │
│              ▲              ▲                   ▲                │
│              │              │                   │                │
│              └──────REST API/Socket.IO──────────┘                │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                       NODE.JS BACKEND                            │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐     │
│  │  Express   │  │  Socket.IO  │  │  RabbitMQ Publisher  │     │
│  │   Server   │  │   Server    │  │                      │     │
│  └────────────┘  └─────────────┘  └──────────────────────┘     │
│         │               │                    │                   │
│         └───────────────┴────────────────────┘                   │
└──────────────────────────┬──┬────────────────────────────────────┘
                           │  │
              ┌────────────┘  └─────────────┐
              ▼                              ▼
┌─────────────────────────┐    ┌───────────────────────────┐
│       MySQL DB          │    │      RabbitMQ Server      │
│  ┌──────────────────┐   │    │  ┌──────────────────────┐│
│  │ users            │   │    │  │ announcement_queue   ││
│  │ announcements    │   │    │  │ (3 days retention)   ││
│  │ meetings         │   │    │  └──────────────────────┘│
│  │ messages         │   │    │             │             │
│  └──────────────────┘   │    └─────────────┼─────────────┘
└─────────────────────────┘                  │
                                             ▼
                           ┌──────────────────────────────┐
                           │   Announcement Worker        │
                           │   (RabbitMQ Consumer)        │
                           │   - Duyuruları tüketir       │
                           │   - MySQL'e kaydeder         │
                           │   - 3 gün saklama            │
                           └──────────────────────────────┘
```

---

## 📦 Kurulum

### Gereksinimler

- **Node.js** 18+ ([İndir](https://nodejs.org/))
- **MySQL** 8+ ([İndir](https://dev.mysql.com/downloads/))
- **RabbitMQ** 3.x ([İndir](https://www.rabbitmq.com/download.html))

### 1️⃣ Projeyi Klonlayın

```bash
git clone <repository-url>
cd siteyonetim
```

### 2️⃣ MySQL Veritabanını Oluşturun

```sql
CREATE DATABASE siteyonetim_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Şema dosyasını içe aktarın:

```bash
mysql -u root -p siteyonetim_db < db/schema.sql
```

### 3️⃣ RabbitMQ Kurulumu ve Başlatma

#### Windows:
```powershell
# RabbitMQ'yu başlat
rabbitmq-server
```

#### Linux/Mac:
```bash
# RabbitMQ servisini başlat
sudo systemctl start rabbitmq-server
# veya
brew services start rabbitmq
```

Management plugin'i aktifleştirin:
```bash
rabbitmq-plugins enable rabbitmq_management
```

RabbitMQ Management Console: http://localhost:15672 (guest/guest)

### 4️⃣ Backend Kurulumu

```bash
cd server
npm install

# .env dosyasını oluşturun
cp .env.example .env

# .env dosyasını düzenleyin (veritabanı bilgileri, JWT secret vs.)
# nano .env veya notepad .env
```

**server/.env** örneği:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=siteyonetim_db
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=your-super-secret-jwt-key-change-this

RABBITMQ_URL=amqp://localhost:5672

CLIENT_URL=http://localhost:5173
```

Backend'i başlatın:
```bash
npm run dev
```

### 5️⃣ Worker Servisini Başlatın

Yeni bir terminal açın:

```bash
cd server
npm run worker
```

### 6️⃣ Frontend Kurulumu

Yeni bir terminal açın:

```bash
cd client
npm install

# .env dosyasını oluşturun
cp .env.example .env
```

**client/.env** örneği:
```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

Frontend'i başlatın:
```bash
npm run dev
```

---

## 🚀 Kullanım

### Uygulamaya Erişim

Frontend: http://localhost:5173  
Backend API: http://localhost:3000  
Health Check: http://localhost:3000/health

### Test Kullanıcıları

#### Admin Hesabı
- **Kullanıcı Adı:** `admin`
- **Şifre:** `admin123`
- **Yetkiler:** Tüm admin işlemleri

#### Normal Kullanıcı
- **Kullanıcı Adı:** `ahmet.yilmaz`
- **Şifre:** `admin123`
- **Yetkiler:** Duyuru görüntüleme, toplantıya katılma

### Admin Paneli Özellikleri

1. **Yeni Duyuru Oluşturma**
   - Dashboard → "Yeni Duyuru" butonu
   - Başlık, içerik, öncelik ve kategori belirtin
   - Duyuru anında tüm kullanıcılara iletilir

2. **Toplantı Planlama**
   - Dashboard → "Yeni Toplantı" butonu
   - Toplantı türü seçin (Video/Chat)
   - Tarih ve katılımcıları belirleyin

3. **Kullanıcı Ekleme**
   - Admin Panel → "Kullanıcı Yönetimi"
   - Yeni kullanıcı bilgilerini girin
   - Rol ata (Admin/User)

---

## 📚 API Dokümantasyonu

### Authentication

#### POST `/api/auth/login`
Kullanıcı girişi

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Giriş başarılı",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@siteyonetim.com",
      "fullName": "Site Yöneticisi",
      "role": "admin"
    }
  }
}
```

#### GET `/api/auth/me`
Mevcut kullanıcı bilgilerini getir (Token gerekli)

### Announcements

#### GET `/api/announcements`
Tüm duyuruları listele (Token gerekli)

Query Parameters:
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına kayıt (default: 20)
- `priority`: Öncelik filtresi (urgent, high, medium, low)
- `category`: Kategori filtresi

#### POST `/api/announcements`
Yeni duyuru oluştur (Admin gerekli)

**Request:**
```json
{
  "title": "Aidat Hatırlatması",
  "content": "Aylık aidatların son ödeme tarihi 10 Kasım'dır.",
  "priority": "high",
  "category": "Aidat",
  "expiresAt": "2025-11-10T23:59:59Z"
}
```

### Meetings

#### GET `/api/meetings`
Tüm toplantıları listele (Token gerekli)

#### POST `/api/meetings`
Yeni toplantı oluştur (Admin gerekli)

**Request:**
```json
{
  "title": "Aylık Site Toplantısı",
  "description": "Kasım ayı rutin toplantısı",
  "meetingType": "video",
  "scheduledAt": "2025-11-05T19:00:00Z",
  "maxParticipants": 50
}
```

### Users (Admin Only)

#### GET `/api/users`
Tüm kullanıcıları listele

#### POST `/api/users`
Yeni kullanıcı ekle

**Request:**
```json
{
  "username": "ayse.kaya",
  "email": "ayse@example.com",
  "password": "secure123",
  "fullName": "Ayşe Kaya",
  "role": "user",
  "apartmentNumber": "C-12",
  "phone": "+90 555 222 33 44"
}
```

---

## 📁 Proje Yapısı

```
siteyonetim/
├── server/                      # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Yapılandırma dosyaları
│   │   │   ├── database.js     # Sequelize config
│   │   │   ├── rabbitmq.js     # RabbitMQ config
│   │   │   └── socket.js       # Socket.IO config
│   │   ├── controllers/        # Route controller'ları
│   │   │   ├── authController.js
│   │   │   ├── announcementController.js
│   │   │   ├── meetingController.js
│   │   │   └── userController.js
│   │   ├── middleware/         # Middleware fonksiyonları
│   │   │   └── auth.js         # JWT authentication
│   │   ├── models/             # Sequelize modelleri
│   │   │   ├── User.js
│   │   │   ├── Announcement.js
│   │   │   ├── Meeting.js
│   │   │   ├── Message.js
│   │   │   └── index.js
│   │   ├── routes/             # API route'ları
│   │   │   ├── authRoutes.js
│   │   │   ├── announcementRoutes.js
│   │   │   ├── meetingRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── workers/            # Background workers
│   │   │   └── announcementWorker.js
│   │   └── index.js            # Ana sunucu dosyası
│   ├── package.json
│   └── .env.example
│
├── client/                      # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/         # React bileşenleri
│   │   │   ├── Layout.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/            # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── pages/              # Sayfa bileşenleri
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── AnnouncementsPage.jsx
│   │   │   ├── MeetingsPage.jsx
│   │   │   ├── MeetingRoomPage.jsx
│   │   │   └── AdminPage.jsx
│   │   ├── services/           # API ve Socket servisleri
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   ├── App.jsx             # Ana uygulama bileşeni
│   │   ├── main.jsx            # Giriş noktası
│   │   └── index.css           # Global stiller
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
├── db/                          # Veritabanı dosyaları
│   └── schema.sql              # MySQL şema
│
└── README.md                    # Bu dosya
```

---

## 🔒 Güvenlik

- JWT token'ları 7 gün geçerlidir
- Şifreler bcrypt ile hashlenmiştir
- CORS koruması aktiftir
- Helmet.js ile HTTP header güvenliği
- SQL injection koruması (Sequelize ORM)
- Rate limiting (opsiyonel, eklenebilir)

---

## 🌐 Sistem Çalışma Akışı

### 1. Duyuru Akışı
1. Admin yeni duyuru oluşturur (Frontend → Backend API)
2. Backend duyuruyu MySQL'e kaydeder
3. RabbitMQ kuyruğuna mesaj gönderilir (3 gün saklama)
4. Socket.IO ile tüm bağlı kullanıcılara anında bildirim
5. Worker servisi kuyruğu dinler ve yedekleme sağlar

### 2. Toplantı Akışı
1. Admin toplantı oluşturur ve planlar
2. Kullanıcılar toplantı listesini görür
3. Kullanıcı toplantıya katılır (Socket.IO room join)
4. Gerçek zamanlı mesajlaşma başlar
5. Video/Chat seçimine göre arayüz değişir

### 3. Kullanıcı Yönetimi
1. Admin yeni kullanıcı ekler (kayıt sistemi yok)
2. Kullanıcı bilgileri MySQL'e kaydedilir
3. Kullanıcı login olabilir ve sistem kullanabilir

---

## 🎯 Gelecek Özellikler (Roadmap)

- [ ] WebRTC video chat entegrasyonu
- [ ] E-posta bildirimleri
- [ ] Dosya paylaşımı
- [ ] Aidat yönetim modülü
- [ ] Mobil uygulama (React Native)
- [ ] Bildirim tercihleri
- [ ] Gelişmiş raporlama

---

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'feat: Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

## 📞 İletişim

Proje Yöneticisi - Site Yönetim Sistemi

---

## 🙏 Teşekkürler

- Node.js ve Express.js ekiplerine
- Socket.IO geliştiricilerine
- RabbitMQ topluluğuna
- React ve Vite ekiplerine
- Tüm açık kaynak katkıda bulunanlara

---

**⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!**
