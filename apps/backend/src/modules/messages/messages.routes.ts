import { IRouter, Router } from 'express'
import * as messagesController from './messages.controller'
import { authenticate } from '../../middlewares/auth.middleware'
import { validate } from '../../middlewares/validate.middleware'
import { sendReplySchema, bulkReplySchema, regenerateSchema } from './messages.validation'
import { rateLimit } from 'express-rate-limit'

const router: IRouter = Router()

const messagesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})

// All routes require authentication
router.use(authenticate)
router.use(messagesLimiter)

// ── Messages CRUD ─────────────────────────────────────────
router.get('/', messagesController.getMessages)
router.get('/:id', messagesController.getMessage)

// ── Tone Variants ─────────────────────────────────────────
router.get('/:id/tone/:tone', messagesController.getToneVariant)

// ── Reply ─────────────────────────────────────────────────
router.patch('/:id/reply', validate(sendReplySchema), messagesController.sendReply)
router.post('/bulk-reply', validate(bulkReplySchema), messagesController.bulkSendReplies)

// ── Actions ───────────────────────────────────────────────
router.patch('/:id/archive', messagesController.archiveMessage)
router.post('/:id/regenerate', validate(regenerateSchema), messagesController.regenerateDraft)

export default router