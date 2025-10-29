// Announcement Controller - Duyuru yönetimi
import { Announcement, User } from '../models/index.js';
import { publishAnnouncement } from '../config/rabbitmq.js';
import { emitToAll } from '../config/socket.js';
import { Op } from 'sequelize';

/**
 * Tüm duyuruları listele
 * GET /api/announcements
 */
export const getAllAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 20, priority, category } = req.query;
    const offset = (page - 1) * limit;

    // Filtreler
    const where = { isActive: true };
    
    if (priority) {
      where.priority = priority;
    }
    
    if (category) {
      where.category = category;
    }

    const announcements = await Announcement.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'fullName', 'username']
        }
      ],
      order: [
        ['priority', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        announcements: announcements.rows,
        pagination: {
          total: announcements.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(announcements.count / limit)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Duyurular alınamadı',
      error: error.message
    });
  }
};

/**
 * Belirli bir duyuruyu getir
 * GET /api/announcements/:id
 */
export const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'fullName', 'username', 'email']
        }
      ]
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Duyuru bulunamadı'
      });
    }

    // Görüntülenme sayısını artır
    announcement.viewCount += 1;
    await announcement.save();

    res.json({
      success: true,
      data: { announcement }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Duyuru alınamadı',
      error: error.message
    });
  }
};

/**
 * Yeni duyuru oluştur (Sadece admin)
 * POST /api/announcements
 */
export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, priority, category, expiresAt } = req.body;

    // Validasyon
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Başlık ve içerik gerekli'
      });
    }

    // Duyuruyu oluştur
    const announcement = await Announcement.create({
      title,
      content,
      authorId: req.user.id,
      priority: priority || 'medium',
      category,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    // RabbitMQ kuyruğuna gönder (3 gün saklama için)
    try {
      await publishAnnouncement(announcement);
    } catch (rabbitError) {
      console.error('RabbitMQ publish hatası:', rabbitError.message);
      // RabbitMQ hatası olsa bile duyuru oluşturuldu, devam et
    }

    // Socket.IO ile tüm kullanıcılara bildir
    try {
      emitToAll('announcement:new', {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        category: announcement.category,
        createdAt: announcement.createdAt,
        author: {
          id: req.user.id,
          fullName: req.user.fullName
        }
      });
    } catch (socketError) {
      console.error('Socket.IO emit hatası:', socketError.message);
    }

    // Tam duyuru bilgilerini getir
    const fullAnnouncement = await Announcement.findByPk(announcement.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'fullName', 'username']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Duyuru başarıyla oluşturuldu',
      data: { announcement: fullAnnouncement }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Duyuru oluşturulamadı',
      error: error.message
    });
  }
};

/**
 * Duyuru güncelle (Sadece admin)
 * PUT /api/announcements/:id
 */
export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, priority, category, expiresAt, isActive } = req.body;

    const announcement = await Announcement.findByPk(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Duyuru bulunamadı'
      });
    }

    // Güncelle
    await announcement.update({
      title: title || announcement.title,
      content: content || announcement.content,
      priority: priority || announcement.priority,
      category: category || announcement.category,
      expiresAt: expiresAt ? new Date(expiresAt) : announcement.expiresAt,
      isActive: isActive !== undefined ? isActive : announcement.isActive
    });

    // Güncellenmiş duyuruyu getir
    const updatedAnnouncement = await Announcement.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'fullName', 'username']
        }
      ]
    });

    // Socket.IO ile bildir
    emitToAll('announcement:updated', {
      id: updatedAnnouncement.id,
      title: updatedAnnouncement.title,
      content: updatedAnnouncement.content,
      priority: updatedAnnouncement.priority,
      updatedAt: updatedAnnouncement.updatedAt
    });

    res.json({
      success: true,
      message: 'Duyuru güncellendi',
      data: { announcement: updatedAnnouncement }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Duyuru güncellenemedi',
      error: error.message
    });
  }
};

/**
 * Duyuru sil (Sadece admin)
 * DELETE /api/announcements/:id
 */
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByPk(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Duyuru bulunamadı'
      });
    }

    await announcement.destroy();

    // Socket.IO ile bildir
    emitToAll('announcement:deleted', { id });

    res.json({
      success: true,
      message: 'Duyuru silindi'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Duyuru silinemedi',
      error: error.message
    });
  }
};

export default {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
