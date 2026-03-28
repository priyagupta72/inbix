import { Router, type Router as ExpressRouter } from 'express'
import * as authController from './auth.controller'
import { authenticate } from '../../middlewares/auth.middleware'
import { rateLimit } from 'express-rate-limit'

const router: ExpressRouter = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many email requests, please try again in an hour.',
  standardHeaders: true,
  legacyHeaders: false,
})

// ── Registration ──────────────────────────────────────────
router.post('/register', authLimiter, authController.register)
router.get('/verify-email', authController.verifyEmail)
router.post('/resend-verification', emailLimiter, authController.resendVerificationEmail)

// ── Login ─────────────────────────────────────────────────
router.post('/login', authLimiter, authController.loginWithEmail)
router.post('/login/google', authLimiter, authController.loginWithGoogle)

// ── Password ──────────────────────────────────────────────
router.post('/forgot-password', emailLimiter, authController.forgotPassword)
router.post('/reset-password', authLimiter, authController.resetPassword)
router.get('/reset-password/:token', authController.validateResetToken)

// ── Token ─────────────────────────────────────────────────
router.post('/refresh-token', authController.refreshAccessToken)

// ── Protected ─────────────────────────────────────────────
router.get('/me', authenticate, authController.getCurrentUser)
router.post('/logout', authenticate, authController.logout)
router.post('/logout/all', authenticate, authController.logoutAllDevices)

export default router