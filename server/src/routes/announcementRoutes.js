// Announcement Routes
import express from 'express';
import {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '../controllers/announcementController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/announcements
 * @desc    Tüm duyuruları listele
 * @access  Private
 */
router.get('/', authenticateToken, getAllAnnouncements);

/**
 * @route   GET /api/announcements/:id
 * @desc    Belirli bir duyuruyu getir
 * @access  Private
 */
router.get('/:id', authenticateToken, getAnnouncementById);

/**
 * @route   POST /api/announcements
 * @desc    Yeni duyuru oluştur
 * @access  Private (Admin only)
 */
router.post('/', authenticateToken, requireAdmin, createAnnouncement);

/**
 * @route   PUT /api/announcements/:id
 * @desc    Duyuru güncelle
 * @access  Private (Admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, updateAnnouncement);

/**
 * @route   DELETE /api/announcements/:id
 * @desc    Duyuru sil
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteAnnouncement);

export default router;
