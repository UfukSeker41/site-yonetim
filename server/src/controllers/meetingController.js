// Meeting Controller - Toplantı yönetimi
import { Meeting, User, Message } from '../models/index.js';
import { emitToAll, emitToMeeting } from '../config/socket.js';
import { nanoid } from 'nanoid';

/**
 * Tüm toplantıları listele
 * GET /api/meetings
 */
export const getAllMeetings = async (req, res) => {
  try {
    const { status, type } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.meetingType = type;

    const meetings = await Meeting.findAll({
      where,
      include: [
        {
          model: User,
          as: 'host',
          attributes: ['id', 'fullName', 'username']
        }
      ],
      order: [['scheduled_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { meetings }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Toplantılar alınamadı',
      error: error.message
    });
  }
};

/**
 * Belirli bir toplantı bilgilerini getir
 * GET /api/meetings/:id
 */
export const getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findByPk(id, {
      include: [
        {
          model: User,
          as: 'host',
          attributes: ['id', 'fullName', 'username', 'email']
        },
        {
          model: Message,
          as: 'messages',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'username']
            }
          ],
          order: [['created_at', 'ASC']],
          limit: 100
        }
      ]
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı'
      });
    }

    res.json({
      success: true,
      data: { meeting }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Toplantı bilgileri alınamadı',
      error: error.message
    });
  }
};

/**
 * Room ID ile toplantı bilgilerini getir
 * GET /api/meetings/room/:roomId
 */
export const getMeetingByRoomId = async (req, res) => {
  try {
    const { roomId } = req.params;

    const meeting = await Meeting.findOne({
      where: { roomId },
      include: [
        {
          model: User,
          as: 'host',
          attributes: ['id', 'fullName', 'username']
        }
      ]
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı'
      });
    }

    res.json({
      success: true,
      data: { meeting }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Toplantı bilgileri alınamadı',
      error: error.message
    });
  }
};

/**
 * Yeni toplantı oluştur (Sadece admin)
 * POST /api/meetings
 */
export const createMeeting = async (req, res) => {
  try {
    const { title, description, meetingType, scheduledAt, maxParticipants } = req.body;

    // Validasyon
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Toplantı başlığı gerekli'
      });
    }

    // Benzersiz room ID oluştur
    const roomId = nanoid(10);

    // Toplantıyı oluştur
    const meeting = await Meeting.create({
      title,
      description,
      meetingType: meetingType || 'chat',
      roomId,
      hostId: req.user.id,
      status: 'scheduled',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      maxParticipants: maxParticipants || 100
    });

    // Tam toplantı bilgilerini getir
    const fullMeeting = await Meeting.findByPk(meeting.id, {
      include: [
        {
          model: User,
          as: 'host',
          attributes: ['id', 'fullName', 'username']
        }
      ]
    });

    // Socket.IO ile tüm kullanıcılara bildir
    emitToAll('meeting:created', {
      id: fullMeeting.id,
      title: fullMeeting.title,
      roomId: fullMeeting.roomId,
      meetingType: fullMeeting.meetingType,
      scheduledAt: fullMeeting.scheduledAt,
      host: {
        id: req.user.id,
        fullName: req.user.fullName
      }
    });

    res.status(201).json({
      success: true,
      message: 'Toplantı başarıyla oluşturuldu',
      data: { meeting: fullMeeting }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Toplantı oluşturulamadı',
      error: error.message
    });
  }
};

/**
 * Toplantıyı başlat (Sadece host)
 * POST /api/meetings/:id/start
 */
export const startMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findByPk(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı'
      });
    }

    // Sadece host başlatabilir veya admin
    if (meeting.hostId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu toplantıyı başlatma yetkiniz yok'
      });
    }

    if (meeting.status === 'ongoing') {
      return res.status(400).json({
        success: false,
        message: 'Toplantı zaten devam ediyor'
      });
    }

    // Toplantıyı başlat
    await meeting.update({
      status: 'ongoing',
      startedAt: new Date()
    });

    // Socket.IO ile bildir
    emitToAll('meeting:started', {
      id: meeting.id,
      roomId: meeting.roomId,
      title: meeting.title,
      startedAt: meeting.startedAt
    });

    res.json({
      success: true,
      message: 'Toplantı başlatıldı',
      data: { meeting }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Toplantı başlatılamadı',
      error: error.message
    });
  }
};

/**
 * Toplantıyı sonlandır (Sadece host)
 * POST /api/meetings/:id/end
 */
export const endMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findByPk(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı'
      });
    }

    // Sadece host sonlandırabilir veya admin
    if (meeting.hostId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu toplantıyı sonlandırma yetkiniz yok'
      });
    }

    // Toplantıyı sonlandır
    await meeting.update({
      status: 'completed',
      endedAt: new Date()
    });

    // Socket.IO ile bildir
    emitToMeeting(meeting.roomId, 'meeting:ended', {
      id: meeting.id,
      roomId: meeting.roomId,
      endedAt: meeting.endedAt
    });

    res.json({
      success: true,
      message: 'Toplantı sonlandırıldı',
      data: { meeting }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Toplantı sonlandırılamadı',
      error: error.message
    });
  }
};

/**
 * Toplantı sil (Sadece admin)
 * DELETE /api/meetings/:id
 */
export const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findByPk(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Toplantı bulunamadı'
      });
    }

    await meeting.destroy();

    res.json({
      success: true,
      message: 'Toplantı silindi'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Toplantı silinemedi',
      error: error.message
    });
  }
};

export default {
  getAllMeetings,
  getMeetingById,
  getMeetingByRoomId,
  createMeeting,
  startMeeting,
  endMeeting,
  deleteMeeting
};
