# 🏗️ Site Yönetim Sistemi - Mimari Dokümantasyonu

## 📊 Sistem Genel Bakış

Bu belge, Site Yönetim Sistemi'nin teknik mimarisini, bileşenlerini ve çalışma prensiplerini detaylı şekilde açıklar.

---

## 🎯 Sistem Hedefleri

1. **Gerçek Zamanlı İletişim**: Site sakinleri ve yöneticiler arasında anlık bilgi akışı
2. **Güvenilir Mesaj Teslimatı**: RabbitMQ ile 3 gün mesaj saklama garantisi
3. **Ölçeklenebilirlik**: Modüler yapı ile kolay genişletilebilme
4. **Kullanıcı Dostu Arayüz**: Modern ve responsive tasarım
5. **Güvenlik**: JWT ve rol tabanlı erişim kontrolü

---

## 🔄 Mimari Akış

### Katmanlı Mimari (Layered Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│                    (React Frontend)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │  Components  │  │    Pages     │  │    Context       │      │
│  │  (UI)        │  │    (Views)   │  │    (State)       │      │
│  └──────────────┘  └──────────────┘  └──────────────────┘      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│                    (Express Server)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │   Routes     │  │ Controllers  │  │   Middleware     │      │
│  │   (API)      │  │  (Logic)     │  │   (Auth/Valid)   │      │
│  └──────────────┘  └──────────────┘  └──────────────────┘      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    DATA ACCESS LAYER                             │
│                    (Sequelize ORM)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │    Models    │  │  Validators  │  │   Migrations     │      │
│  │ (Entities)   │  │  (Rules)     │  │   (Schema)       │      │
│  └──────────────┘  └──────────────┘  └──────────────────┘      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    DATA LAYER                                    │
│  ┌────────────────────┐           ┌────────────────────────┐    │
│  │   MySQL Database   │           │   RabbitMQ Broker      │    │
│  │  (Persistent Data) │           │  (Message Queue)       │    │
│  └────────────────────┘           └────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 Bileşenler ve Sorumlulukları

### 1. Frontend (React + Vite)

#### 📱 Presentation Layer
- **Görev**: Kullanıcı arayüzü ve etkileşimleri
- **Teknolojiler**: React 18, Tailwind CSS, Lucide Icons
- **Sorumluluğu**:
  - UI rendering
  - Kullanıcı etkileşimleri
  - Form validasyonu
  - State yönetimi (Context API)

#### 🔗 Service Layer (Client Side)
- **API Service**: REST API çağrıları (Axios)
- **Socket Service**: WebSocket bağlantıları (Socket.IO)
- **Auth Service**: Token yönetimi ve authentication

### 2. Backend (Node.js + Express)

#### 🌐 API Gateway Layer
- **Express Router**: HTTP request routing
- **Middleware Stack**:
  - `helmet`: Security headers
  - `cors`: Cross-origin kaynak paylaşımı
  - `morgan`: HTTP request logging
  - `express.json()`: JSON body parsing

#### 🛡️ Security Layer
- **JWT Authentication**: Token tabanlı kimlik doğrulama
- **Role-Based Access Control (RBAC)**: Admin/User yetkilendirme
- **Password Hashing**: Bcrypt ile şifreleme

#### 🎮 Business Logic Layer
- **Controllers**:
  - `authController`: Login/logout işlemleri
  - `announcementController`: Duyuru CRUD
  - `meetingController`: Toplantı yönetimi
  - `userController`: Kullanıcı yönetimi

#### 💾 Data Access Layer
- **Sequelize ORM**: Database abstraction
- **Models**: User, Announcement, Meeting, Message
- **Associations**: İlişkisel veri modelleme

### 3. Real-Time Communication (Socket.IO)

#### 📡 Socket.IO Server
```javascript
// Event Types
- 'connection': Kullanıcı bağlantısı
- 'announcement:new': Yeni duyuru bildirimi
- 'meeting:join': Toplantıya katılma
- 'meeting:message': Chat mesajı
- 'meeting:user-joined': Katılımcı girişi
- 'meeting:user-left': Katılımcı çıkışı
- 'webrtc:offer/answer/ice-candidate': Video chat sinyalleri
```

#### 🔒 Socket Authentication
1. Client token ile bağlanır
2. Server JWT token'ı doğrular
3. Kullanıcı bilgileri socket'e eklenir
4. User-specific room'a join olur

### 4. Message Queue (RabbitMQ)

#### 📮 Publisher Pattern
```javascript
// Announcement publish
1. Admin duyuru oluşturur
2. Duyuru MySQL'e kaydedilir
3. RabbitMQ kuyruğuna gönderilir
4. TTL: 3 gün (259200000 ms)
```

#### 📥 Consumer Pattern
```javascript
// Worker servisi
1. Kuyruğu dinler (announcement_queue)
2. Mesaj geldiğinde işler
3. MySQL'e yedek kaydeder
4. ACK gönderir
5. 3 gün sonra otomatik silinir
```

---

## 📊 Veri Akış Diyagramı

### Duyuru Oluşturma Akışı

```
┌───────────┐         ┌───────────┐         ┌───────────┐
│   Admin   │         │  Backend  │         │   MySQL   │
│  (React)  │         │ (Express) │         │ Database  │
└─────┬─────┘         └─────┬─────┘         └─────┬─────┘
      │                     │                     │
      │  POST /announcements│                     │
      │────────────────────>│                     │
      │                     │                     │
      │                     │  INSERT announcement│
      │                     │────────────────────>│
      │                     │                     │
      │                     │<────────────────────│
      │                     │     (success)       │
      │                     │                     │
      │                     │         ┌───────────▼─────┐
      │                     │         │    RabbitMQ     │
      │                     │  Publish│   (Queue TTL:   │
      │                     │─────────>   3 days)       │
      │                     │         └───────────┬─────┘
      │                     │                     │
      │  Socket.IO Emit     │                     │
      │<────────────────────┤                     │
      │  'announcement:new' │                     │
      │                     │         ┌───────────▼─────┐
┌─────▼─────┐              │         │  Worker Service │
│All Clients│              │         │   (Consumer)    │
│(Real-time)│              │         └─────────────────┘
└───────────┘              │
```

### Toplantı Katılım Akışı

```
┌───────────┐         ┌───────────┐         ┌───────────┐
│   User    │         │ Socket.IO │         │   MySQL   │
│  (React)  │         │  Server   │         │ Database  │
└─────┬─────┘         └─────┬─────┘         └─────┬─────┘
      │                     │                     │
      │  Emit 'meeting:join'│                     │
      │────────────────────>│                     │
      │       (roomId)      │                     │
      │                     │  SELECT meeting     │
      │                     │────────────────────>│
      │                     │                     │
      │                     │<────────────────────│
      │                     │  (meeting data)     │
      │                     │                     │
      │  socket.join(room)  │                     │
      │<────────────────────│                     │
      │                     │                     │
      │  Emit 'meeting:joined'                    │
      │<────────────────────┤                     │
      │                     │                     │
      │  Broadcast to room  │                     │
      │<────────────────────┤                     │
      │ 'meeting:user-joined'                     │
      │                     │                     │
```

---

## 🗄️ Veritabanı Şeması

### Entity Relationship Diagram (ERD)

```
┌─────────────────┐           ┌──────────────────┐
│     users       │           │  announcements   │
├─────────────────┤           ├──────────────────┤
│ id (PK)         │───┐       │ id (PK)          │
│ username        │   │   ┌───│ author_id (FK)   │
│ email           │   │   │   │ title            │
│ password        │   │   │   │ content          │
│ full_name       │   │   │   │ priority         │
│ role (ENUM)     │   │   │   │ category         │
│ apartment_no    │   └───────│ expires_at       │
│ phone           │       │   │ view_count       │
│ is_active       │       │   │ created_at       │
│ last_login      │       │   │ updated_at       │
│ created_at      │       │   └──────────────────┘
│ updated_at      │       │
└─────────────────┘       │   ┌──────────────────┐
         │                │   │    meetings      │
         │                │   ├──────────────────┤
         │                │   │ id (PK)          │
         │                └───│ host_id (FK)     │
         │                    │ title            │
         │                ┌───│ room_id (UNIQUE) │
         │                │   │ meeting_type     │
         │                │   │ status (ENUM)    │
         │                │   │ scheduled_at     │
         │                │   │ started_at       │
         │                │   │ ended_at         │
         │                │   │ max_participants │
         │                │   └──────────────────┘
         │                │            │
         │                │            │
         │                │   ┌────────▼─────────┐
         │                │   │    messages      │
         │                │   ├──────────────────┤
         │                │   │ id (PK)          │
         │                │   │ meeting_id (FK)  │
         │                └───│ user_id (FK)     │
         │                    │ content          │
         └────────────────────│ message_type     │
                              │ is_read          │
                              │ created_at       │
                              └──────────────────┘

Relationships:
- users 1:N announcements (author)
- users 1:N meetings (host)
- users 1:N messages (sender)
- meetings 1:N messages (conversation)
```

---

## 🔐 Güvenlik Katmanları

### 1. Authentication Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │         │  Server  │         │ Database │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │  POST /login       │                    │
     │ {username,password}│                    │
     │───────────────────>│                    │
     │                    │                    │
     │                    │ SELECT user        │
     │                    │───────────────────>│
     │                    │                    │
     │                    │<───────────────────│
     │                    │    (user data)     │
     │                    │                    │
     │                    │ bcrypt.compare()   │
     │                    │ (verify password)  │
     │                    │                    │
     │                    │ jwt.sign()         │
     │                    │ (generate token)   │
     │                    │                    │
     │  {token, user}     │                    │
     │<───────────────────│                    │
     │                    │                    │
     │  Store token in    │                    │
     │  localStorage      │                    │
     │                    │                    │
```

### 2. Authorization Middleware

```javascript
// JWT Verification Flow
Request → Extract Token → Verify JWT → Check User → Check Role → Allow/Deny

// Middleware Stack
authenticateToken() → requireAuth() → requireAdmin()
```

### 3. Security Headers (Helmet.js)

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`

---

## ⚡ Performans Optimizasyonları

### Frontend
- **Code Splitting**: Route-based lazy loading
- **Memoization**: React.memo, useMemo, useCallback
- **Virtual Scrolling**: Uzun liste optimizasyonu
- **Image Optimization**: Lazy loading, WebP format
- **Bundle Size**: Vite tree-shaking

### Backend
- **Database Indexing**: Primary keys, foreign keys, search columns
- **Connection Pooling**: Sequelize pool config (max: 10)
- **Caching**: Redis eklenebilir (future)
- **Query Optimization**: Include/exclude ile selective loading
- **Pagination**: Limit/offset ile sayfalama

### Real-Time
- **Socket.IO Rooms**: User-specific ve meeting-specific rooms
- **Binary Protocol**: WebSocket binary data transmission
- **Reconnection**: Otomatik yeniden bağlanma stratejisi

---

## 🔄 Ölçeklenebilirlik Stratejisi

### Horizontal Scaling

```
┌─────────────────────────────────────────────┐
│         Load Balancer (Nginx)               │
└──────────┬──────────────┬───────────────────┘
           │              │
    ┌──────▼─────┐  ┌─────▼──────┐
    │ Node.js #1 │  │ Node.js #2 │  ← Multiple instances
    │ (Express)  │  │ (Express)  │
    └──────┬─────┘  └─────┬──────┘
           │              │
           └──────┬───────┘
                  │
    ┌─────────────▼─────────────┐
    │     MySQL Cluster         │
    │  (Master-Slave Replication)│
    └───────────────────────────┘

Socket.IO Scaling:
- Redis Adapter kullanarak multi-instance socket sync
- Sticky sessions için load balancer config
```

### Vertical Scaling
- CPU: Multi-core processing
- RAM: In-memory caching
- Disk: SSD, RAID configuration

---

## 🚀 Deployment Stratejisi

### Production Checklist

```yaml
Environment Variables:
  ✓ NODE_ENV=production
  ✓ Strong JWT_SECRET
  ✓ Secure database credentials
  ✓ HTTPS enabled
  ✓ CORS configured

Database:
  ✓ Backup strategy
  ✓ Migration scripts
  ✓ Index optimization
  ✓ Connection pooling

Security:
  ✓ Rate limiting
  ✓ DDoS protection
  ✓ Input validation
  ✓ SQL injection prevention
  ✓ XSS protection

Monitoring:
  ✓ Error logging (Winston/Morgan)
  ✓ Performance monitoring
  ✓ Health checks
  ✓ Uptime monitoring
```

### Docker Deployment (Optional)

```dockerfile
# docker-compose.yml structure
services:
  - mysql (database)
  - rabbitmq (message broker)
  - backend (Node.js API)
  - worker (RabbitMQ consumer)
  - frontend (React build)
  - nginx (reverse proxy)
```

---

## 📈 İzleme ve Loglama

### Log Levels
```
ERROR   → Kritik hatalar (DB connection fail)
WARN    → Uyarılar (Deprecated API usage)
INFO    → Genel bilgiler (Server started)
DEBUG   → Detaylı debug bilgileri
```

### Metrics
- API Response Times
- Database Query Performance
- Socket.IO Connection Count
- RabbitMQ Queue Length
- Memory Usage
- CPU Usage

---

## 🎯 Sonuç

Bu mimari:
- ✅ **Modüler**: Her katman bağımsız çalışabilir
- ✅ **Ölçeklenebilir**: Horizontal/vertical scaling desteği
- ✅ **Güvenli**: Çok katmanlı güvenlik
- ✅ **Performanslı**: Optimize edilmiş veri akışı
- ✅ **Sürdürülebilir**: Kolay bakım ve geliştirme

---

**Versiyon:** 1.0.0  
**Son Güncelleme:** 23 Ekim 2025  
**Durum:** Production Ready ✅
