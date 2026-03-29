import { z } from 'zod'

export const getMessagesSchema = z.object({
  category: z.enum(['urgent', 'pricing', 'booking', 'faq', 'complaint', 'spam']).optional(),
  isReplied: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
})

export const sendReplySchema = z.object({
  replyText: z.string().min(1, 'Reply text is required').max(10000),
  tone: z.enum(['prof', 'friend', 'brief', 'formal']).default('prof'),
})

export const bulkReplySchema = z.object({
  messageIds: z.array(z.string()).min(1, 'At least one message ID required').max(50),
})

export const toneSchema = z.object({
  tone: z.enum(['prof', 'friend', 'brief', 'formal']),
})

export const regenerateSchema = z.object({
  tone: z.enum(['prof', 'friend', 'brief', 'formal']).default('prof'),
})