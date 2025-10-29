// JWT Authentication Middleware
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'siteyonetim-secret-key-2025';

/**
 * JWT token oluştur
 */
export const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '7d' } // 7 gün geçerli
  );
};

/**
 * JWT token doğrulama middleware'i
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Token'ı header'dan al
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Erişim reddedildi. Token bulunamadı.'
      });
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Kullanıcıyı veritabanından bul
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Kullanıcı bulunamadı veya hesap devre dışı.'
      });
    }

    // Kullanıcı bilgilerini request'e ekle
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.'
      });
    }
    
    return res.status(403).json({
      success: false,
      message: 'Geçersiz token.',
      error: error.message
    });
  }
};

/**
 * Admin yetkisi kontrolü
 */
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bu işlem için admin yetkisi gereklidir.'
    });
  }
  next();
};

/**
 * Kullanıcı veya admin yetkisi kontrolü
 */
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Kimlik doğrulaması gerekli.'
    });
  }
  next();
};

export default {
  generateToken,
  authenticateToken,
  requireAdmin,
  requireAuth
};
