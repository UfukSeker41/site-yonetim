// Auth Controller - Kullanıcı girişi ve yetkilendirme
import { User } from '../models/index.js';
import { generateToken } from '../middleware/auth.js';

/**
 * Kullanıcı girişi (Login)
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validasyon
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı adı ve şifre gerekli'
      });
    }

    // Kullanıcıyı bul
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı adı veya şifre hatalı'
      });
    }

    // Hesap aktif mi kontrol et
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Hesabınız devre dışı bırakılmış'
      });
    }

    // Şifre doğrulama
    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı adı veya şifre hatalı'
      });
    }

    // Son giriş tarihini güncelle
    user.lastLogin = new Date();
    await user.save();

    // JWT token oluştur
    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          apartmentNumber: user.apartmentNumber,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Giriş işlemi sırasında bir hata oluştu',
      error: error.message
    });
  }
};

/**
 * Mevcut kullanıcı bilgilerini getir
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          apartmentNumber: user.apartmentNumber,
          phone: user.phone,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kullanıcı bilgileri alınamadı',
      error: error.message
    });
  }
};

export default { login, getCurrentUser };
