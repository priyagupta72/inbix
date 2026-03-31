import * as messagesRepository from './messages.repository'
import * as gmailService from '../gmail/gmail.service'
import * as templatesRepository from '../templates/templates.repository'
import { generateToneVariant } from '../ai/ai.service'
import { AppError } from '../../utils/AppError'
import { prisma } from '../../index'
import logger from '../../utils/logger'

// ─── Shared helpers ────────────────────────────────────────────────────────────

const TONE_SHORT_TO_LONG: Record<string, string> = {
  prof:   'professional',
  friend: 'friendly',
  brief:  'brief',
  formal: 'formal',
}

const TONE_LONG_TO_SHORT: Record<string, string> = {
  professional: 'prof',
  friendly:     'friend',
  brief:        'brief',
  formal:       'formal',
}

const TONE_TO_FIELD: Record<string, string> = {
  prof:   'aiReplyProf',
  friend: 'aiReplyFriend',
  brief:  'aiReplyBrief',
  formal: 'aiReplyFormal',
}

/** Fetch user's name, businessName, tonePreference from DB */
const getUserContext = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { name: true, businessName: true, tonePreference: true },
  })
  return {
    name:           user?.name          ?? '',
    businessName:   user?.businessName  ?? '',
    tonePreference: user?.tonePreference ?? 'professional',   // e.g. "professional"
    toneShort:      TONE_LONG_TO_SHORT[user?.tonePreference ?? 'professional'] ?? 'prof',
  }
}

/**
 * Find the best matching template for a message.
 * Strategy: category match first, then keyword (trigger) fallback.
 */
const findMatchingTemplate = async (
  userId:   string,
  category: string,
  subject:  string,
  body:     string
) => {
  const templates = await templatesRepository.findTemplates(userId)
  if (!templates.length) return null

  // 1️⃣  Category match
  const categoryMatch = templates.find(
    (t) => t.category.toLowerCase() === category.toLowerCase()
  )
  if (categoryMatch) return categoryMatch

  // 2️⃣  Keyword (trigger) fallback — check subject + body
  const text = `${subject} ${body}`.toLowerCase()
  const keywordMatch = templates.find((t) =>
    t.trigger && text.includes(t.trigger.toLowerCase())
  )
  return keywordMatch ?? null
}

// ─── Service functions ─────────────────────────────────────────────────────────

export const getMessages = async (
  userId: string,
  filters: {
    category?:   string
    isReplied?:  boolean
    isArchived?: boolean
    page?:       number
    limit?:      number
  }
) => {
  return messagesRepository.findMessages(userId, filters)
}

export const getMessage = async (id: string, userId: string) => {
  const message = await messagesRepository.findMessageById(id, userId)
  if (!message) throw new AppError('Message not found', 404)

  // Mark as read
  if (!message.isRead) {
    await messagesRepository.markAsRead(id)
  }

  // ── Find matching template (category > keyword) ──────────────────────────
  const matchedTemplate = await findMatchingTemplate(
    userId,
    message.category,
    message.subject ?? '',
    message.body
  )

  return {
    ...message,
    // Attach matched template so frontend can show it as a suggestion
    matchedTemplate: matchedTemplate
      ? {
          id:      matchedTemplate.id,
          content: matchedTemplate.content,
          category: matchedTemplate.category,
          trigger:  matchedTemplate.trigger,
        }
      : null,
  }
}

export const getToneVariant = async (
  id:     string,
  userId: string,
  tone:   string
) => {
  const message = await messagesRepository.findMessageById(id, userId)
  if (!message) throw new AppError('Message not found', 404)

  const validTones = ['prof', 'friend', 'brief', 'formal']
  if (!validTones.includes(tone)) {
    throw new AppError('Invalid tone. Must be prof, friend, brief, or formal', 400)
  }

  // Check cache first
  const toneField = TONE_TO_FIELD[tone] as keyof typeof message
  if (message[toneField]) {
    return { draft: message[toneField], cached: true }
  }

  // ✅ Pass user context (name + businessName) to AI
  const { name, businessName } = await getUserContext(userId)

  const draft = await generateToneVariant(
    message.fromName,
    message.fromEmail ?? '',
    message.subject   ?? '',
    message.body,
    TONE_SHORT_TO_LONG[tone],
    name,
    businessName
  )

  await messagesRepository.updateToneReply(id, tone, draft)

  return { draft, cached: false }
}

export const sendReply = async (
  id:        string,
  userId:    string,
  replyText: string,
  tone:      string
) => {
  const message = await messagesRepository.findMessageById(id, userId)
  if (!message) throw new AppError('Message not found', 404)
  if (message.isReplied) throw new AppError('Message already replied', 409)

  await gmailService.sendReply(userId, id, replyText)
  await messagesRepository.markAsReplied(id, replyText, tone)

  logger.info('Reply sent', { messageId: id, userId, tone })

  return { message: 'Reply sent successfully' }
}

export const bulkSendReplies = async (userId: string, messageIds: string[]) => {
  logger.info('Bulk sending replies', { userId, count: messageIds.length })

  // ✅ Fetch user context once for all messages
  const { name, businessName, tonePreference, toneShort } = await getUserContext(userId)
  const replyField = TONE_TO_FIELD[toneShort] as keyof Awaited<ReturnType<typeof messagesRepository.findMessageById>>

  const results = { sent: 0, failed: 0, errors: [] as string[] }

  for (const id of messageIds) {
    try {
      const message = await messagesRepository.findMessageById(id, userId)
      if (!message || message.isReplied) continue

      let replyText: string | null = null
      let usedTone = toneShort

      // ── 1. Template match (category > keyword) ──────────────────────────
      const template = await findMatchingTemplate(
        userId,
        message.category,
        message.subject ?? '',
        message.body
      )

      if (template) {
        // Personalise template placeholders if present
        replyText = template.content
          .replace(/\{name\}/gi,         message.fromName)
          .replace(/\{senderName\}/gi,   name)
          .replace(/\{business\}/gi,     businessName)
        usedTone = 'template'
        await templatesRepository.incrementUseCount(template.id)
        logger.info('Bulk reply using template', { messageId: id, templateId: template.id })

      } else {
        // ── 2. Use preferred-tone AI reply if already cached ──────────────
        replyText = (message[replyField] as string | null) ?? null

        // ── 3. Generate preferred tone on-the-fly if not cached ───────────
        if (!replyText) {
          logger.info('Generating missing tone for bulk reply', { id, toneShort })
          replyText = await generateToneVariant(
            message.fromName,
            message.fromEmail ?? '',
            message.subject   ?? '',
            message.body,
            tonePreference,
            name,
            businessName
          )
          await messagesRepository.updateToneReply(id, toneShort, replyText)
        }

        // ── 4. Last resort: fall back to Professional ─────────────────────
        if (!replyText) {
          replyText = message.aiReplyProf
          usedTone  = 'prof'
        }
      }

      if (!replyText) {
        logger.warn('No reply text available, skipping', { id })
        results.failed++
        continue
      }

      await gmailService.sendReply(userId, id, replyText)
      await messagesRepository.markAsReplied(id, replyText, usedTone)
      results.sent++

    } catch (err) {
      results.failed++
      results.errors.push(`${id}: ${(err as Error).message}`)
      logger.warn('Bulk reply failed for message', { id, error: (err as Error).message })
    }
  }

  return results
}

export const archiveMessage = async (id: string, userId: string) => {
  const message = await messagesRepository.findMessageById(id, userId)
  if (!message) throw new AppError('Message not found', 404)
  await messagesRepository.archiveMessage(id)
  return { message: 'Message archived' }
}

export const regenerateDraft = async (
  id:     string,
  userId: string,
  tone:   string
) => {
  const message = await messagesRepository.findMessageById(id, userId)
  if (!message) throw new AppError('Message not found', 404)

  // ✅ Pass user context to AI
  const { name, businessName } = await getUserContext(userId)

  const draft = await generateToneVariant(
    message.fromName,
    message.fromEmail ?? '',
    message.subject   ?? '',
    message.body,
    TONE_SHORT_TO_LONG[tone] ?? 'professional',
    name,
    businessName
  )

  await messagesRepository.updateToneReply(id, tone, draft)

  return { draft }
}