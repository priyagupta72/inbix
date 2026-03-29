import { Router, IRouter } from 'express'
import * as authController from './auth.controller'
import { authenticate } from '../../middlewares/auth.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { rateLimit } from 'express-rate-limit'
import {
  registerSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  loginSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validateResetTokenSchema,
  refreshTokenSchema,
  logoutSchema,
} from './auth.validation'

const router: IRouter = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many email requests, please try again in an hour.',
  standardHeaders: true,
  legacyHeaders: false,
})

// ── Registration ──────────────────────────────────────────
router.post('/register', authLimiter, validate(registerSchema), authController.register)
router.get('/verify-email', validate(verifyEmailSchema, 'query'), authController.verifyEmail)
router.post('/resend-verification', emailLimiter, validate(resendVerificationSchema), authController.resendVerificationEmail)

// ── Login ─────────────────────────────────────────────────
router.post('/login', authLimiter, validate(loginSchema), authController.loginWithEmail)
router.post('/login/google', authLimiter, validate(googleLoginSchema), authController.loginWithGoogle)

// ── Password ──────────────────────────────────────────────
router.post('/forgot-password', emailLimiter, validate(forgotPasswordSchema), authController.forgotPassword)
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword)
router.get('/reset-password/:token', validate(validateResetTokenSchema, 'params'), authController.validateResetToken)

// ── Token ─────────────────────────────────────────────────
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshAccessToken)

// ── Protected ─────────────────────────────────────────────
router.get('/me', authenticate, authController.getCurrentUser)
router.post('/logout', authenticate, validate(logoutSchema), authController.logout)
router.post('/logout/all', authenticate, authController.logoutAllDevices)

export default router