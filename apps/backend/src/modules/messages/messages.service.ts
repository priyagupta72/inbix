import * as messagesRepository from './messages.repository'
import * as gmailService from '../gmail/gmail.service'
import { generateToneVariant } from '../ai/ai.service'
import { AppError } from '../../utils/AppError'
import logger from '../../utils/logger'

export const getMessages = async (
  userId: string,
  filters: {
    category?: string
    isReplied?: boolean
    isArchived?: boolean
    page?: number
    limit?: number
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

  return message
}

export const getToneVariant = async (
  id: string,
  userId: string,
  tone: string
) => {
  const message = await messagesRepository.findMessageById(id, userId)
  if (!message) throw new AppError('Message not found', 404)

  const validTones = ['prof', 'friend', 'brief', 'formal']
  if (!validTones.includes(tone)) {
    throw new AppError('Invalid tone. Must be prof, friend, brief, or formal', 400)
  }

  // Check if tone already generated
  const toneField = `aiReply${tone.charAt(0).toUpperCase() + tone.slice(1)}` as keyof typeof message
  if (message[toneField]) {
    return { draft: message[toneField], cached: true }
  }

  // Generate new tone variant
  const toneMap: Record<string, string> = {
    prof: 'professional',
    friend: 'friendly',
    brief: 'brief',
    formal: 'formal',
  }

  const draft = await generateToneVariant(
    message.fromName,
    message.fromEmail ?? '',
    message.subject || '',
    message.body,
    toneMap[tone]
  )

  // Cache it
  await messagesRepository.updateToneReply(id, tone, draft)

  return { draft, cached: false }
}

export const sendReply = async (
  id: string,
  userId: string,
  replyText: string,
  tone: string
) => {
  const message = await messagesRepository.findMessageById(id, userId)
  if (!message) throw new AppError('Message not found', 404)
  if (message.isReplied) throw new AppError('Message already replied', 409)

  // Send via Gmail
  await gmailService.sendReply(userId, id, replyText)

  // Mark as replied
  await messagesRepository.markAsReplied(id, replyText, tone)

  logger.info('Reply sent', { messageId: id, userId, tone })

  return { message: 'Reply sent successfully' }
}

export const bulkSendReplies = async (
  userId: string,
  messageIds: string[]
) => {
  logger.info('Bulk sending replies', { userId, count: messageIds.length })

  const results = { sent: 0, failed: 0, errors: [] as string[] }

  for (const id of messageIds) {
    try {
      const message = await messagesRepository.findMessageById(id, userId)
      if (!message || message.isReplied || !message.aiReplyProf) continue

      await gmailService.sendReply(userId, id, message.aiReplyProf)
      await messagesRepository.markAsReplied(id, message.aiReplyProf, 'prof')
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
  id: string,
  userId: string,
  tone: string
) => {
  const message = await messagesRepository.findMessageById(id, userId)
  if (!message) throw new AppError('Message not found', 404)

  const toneMap: Record<string, string> = {
    prof: 'professional',
    friend: 'friendly',
    brief: 'brief',
    formal: 'formal',
  }

  const draft = await generateToneVariant(
    message.fromName,
     message.fromEmail ?? '',
    message.subject || '',
    message.body,
    toneMap[tone] || 'professional'
  )

  await messagesRepository.updateToneReply(id, tone, draft)

  return { draft }
}