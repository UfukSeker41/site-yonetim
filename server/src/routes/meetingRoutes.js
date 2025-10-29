// Meeting Routes
import express from 'express';
import {
  getAllMeetings,
  getMeetingById,
  getMeetingByRoomId,
  createMeeting,
  startMeeting,
  endMeeting,
  deleteMeeting
} from '../controllers/meetingController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/meetings
 * @desc    Tüm toplantıları listele
 * @access  Private
 */
router.get('/', authenticateToken, getAllMeetings);

/**
 * @route   GET /api/meetings/:id
 * @desc    Belirli bir toplantıyı getir
 * @access  Private
 */
router.get('/:id', authenticateToken, getMeetingById);

/**
 * @route   GET /api/meetings/room/:roomId
 * @desc    Room ID ile toplantı getir
 * @access  Private
 */
router.get('/room/:roomId', authenticateToken, getMeetingByRoomId);

/**
 * @route   POST /api/meetings
 * @desc    Yeni toplantı oluştur
 * @access  Private (Admin only)
 */
router.post('/', authenticateToken, requireAdmin, createMeeting);

/**
 * @route   POST /api/meetings/:id/start
 * @desc    Toplantıyı başlat
 * @access  Private (Admin or Host)
 */
router.post('/:id/start', authenticateToken, startMeeting);

/**
 * @route   POST /api/meetings/:id/end
 * @desc    Toplantıyı sonlandır
 * @access  Private (Admin or Host)
 */
router.post('/:id/end', authenticateToken, endMeeting);

/**
 * @route   DELETE /api/meetings/:id
 * @desc    Toplantı sil
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteMeeting);

export default router;
