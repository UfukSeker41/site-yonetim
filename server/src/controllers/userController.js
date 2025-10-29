// User Controller - Kullanıcı yönetimi (Sadece admin)
import { User } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Tüm kullanıcıları listele (Sadece admin)
 * GET /api/users
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;

    const where = {};
    
    if (role) {
      where.role = role;
    }
    
    if (search) {
      where[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { apartmentNumber: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kullanıcılar alınamadı',
      error: error.message
    });
  }
};

/**
 * Belirli bir kullanıcıyı getir
 * GET /api/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kullanıcı bilgileri alınamadı',
      error: error.message
    });
  }
};

/**
 * Yeni kullanıcı ekle (Sadece admin) - Register yerine
 * POST /api/users
 */
export const createUser = async (req, res) => {
  try {
    const { username, email, password, fullName, role, apartmentNumber, phone } = req.body;

    // Validasyon
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı adı, email, şifre ve tam ad gerekli'
      });
    }

    // Kullanıcı adı veya email zaten var mı?
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı adı veya email zaten kullanılıyor'
      });
    }

    // Yeni kullanıcı oluştur
    const user = await User.create({
      username,
      email,
      password, // Model'deki hook otomatik hashleyecek
      fullName,
      role: role || 'user', // Varsayılan role: user
      apartmentNumber,
      phone,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          apartmentNumber: user.apartmentNumber,
          phone: user.phone
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kullanıcı oluşturulamadı',
      error: error.message
    });
  }
};

/**
 * Kullanıcı güncelle (Sadece admin)
 * PUT /api/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, fullName, role, apartmentNumber, phone, isActive, password } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Güncelle
    const updateData = {};
    if (email) updateData.email = email;
    if (fullName) updateData.fullName = fullName;
    if (role) updateData.role = role;
    if (apartmentNumber !== undefined) updateData.apartmentNumber = apartmentNumber;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) updateData.password = password; // Hook otomatik hashleyecek

    await user.update(updateData);

    res.json({
      success: true,
      message: 'Kullanıcı güncellendi',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          apartmentNumber: user.apartmentNumber,
          phone: user.phone,
          isActive: user.isActive
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kullanıcı güncellenemedi',
      error: error.message
    });
  }
};

/**
 * Kullanıcı sil (Sadece admin)
 * DELETE /api/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Kendi hesabını silmeye çalışıyor mu?
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Kendi hesabınızı silemezsiniz'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'Kullanıcı silindi'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kullanıcı silinemedi',
      error: error.message
    });
  }
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
