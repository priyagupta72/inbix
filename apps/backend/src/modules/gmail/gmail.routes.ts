import { IRouter, Router } from 'express'
import * as gmailController from './gmail.controller'
import { authenticate } from '../../middlewares/auth.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { sendReplySchema, connectGmailSchema } from './gmail.validation'
import { rateLimit } from 'express-rate-limit'

const router: IRouter = Router()

const gmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
})

// ── Gmail OAuth ───────────────────────────────────────────
router.get('/auth', authenticate, gmailController.getAuthUrl)
router.get('/callback', validate(connectGmailSchema, 'query'), gmailController.connectGmail)
router.get('/status', authenticate, gmailController.getGmailStatus)      // ← ADD

// ── Email Operations ──────────────────────────────────────
router.post('/fetch', authenticate, gmailLimiter, gmailController.fetchEmails)
router.post('/reply/:messageId', authenticate, validate(sendReplySchema), gmailController.sendReply)
router.delete('/disconnect', authenticate, gmailController.disconnectGmail)
router.get('/analytics', authenticate, gmailController.getAnalyticsHandler)

export default router