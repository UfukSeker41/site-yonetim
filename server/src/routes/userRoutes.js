// User Routes
import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Tüm route'lar admin yetkisi gerektirir

/**
 * @route   GET /api/users
 * @desc    Tüm kullanıcıları listele
 * @access  Private (Admin only)
 */
router.get('/', authenticateToken, requireAdmin, getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Belirli bir kullanıcıyı getir
 * @access  Private (Admin only)
 */
router.get('/:id', authenticateToken, requireAdmin, getUserById);

/**
 * @route   POST /api/users
 * @desc    Yeni kullanıcı ekle (Register yerine)
 * @access  Private (Admin only)
 */
router.post('/', authenticateToken, requireAdmin, createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Kullanıcı güncelle
 * @access  Private (Admin only)
 */
router.put('/:id', authenticateToken, requireAdmin, updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Kullanıcı sil
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteUser);

export default router;
