import { z } from 'zod'

export const connectGmailSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State is required'),
})

export const sendReplySchema = z.object({
  replyText: z.string().min(1, 'Reply text is required').max(10000, 'Reply too long'),
})

export const fetchEmailsSchema = z.object({
  maxResults: z.coerce.number().min(1).max(50).optional().default(10),
})