// Auth Routes
import express from 'express';
import { login, getCurrentUser } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Kullanıcı girişi
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/me
 * @desc    Mevcut kullanıcı bilgilerini getir
 * @access  Private
 */
router.get('/me', authenticateToken, getCurrentUser);

export default router;
