import { google } from 'googleapis'
import { getOAuthClient, GMAIL_SCOPES } from '../../config/gmail.config'
import { prisma } from '../../index'
import { categorizeAndDraft } from '../ai/ai.service'
import logger from '../../utils/logger'
import { AppError } from '../../utils/AppError'

// ─── Get Gmail Auth URL ───────────────────────────────────
export const getAuthUrl = (userId: string): string => {
  const oauth2Client = getOAuthClient()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    state: userId,
    prompt: 'consent',
  })
}

// ─── Exchange Code for Tokens ─────────────────────────────
export const connectGmail = async (userId: string, code: string) => {
  logger.info('Connecting Gmail', { userId })

  const oauth2Client = getOAuthClient()
  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.access_token) {
    throw new AppError('Failed to get Gmail access token', 400)
  }

  // Store tokens in Account table
  await prisma.account.upsert({
    where: { userId_provider: { userId, provider: 'gmail' } },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      isActive: true,
    },
    create: {
      userId,
      provider: 'gmail',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
  })

  logger.info('Gmail connected successfully', { userId })

  return { message: 'Gmail connected successfully' }
}

// ─── Get Gmail Client for User ────────────────────────────
export const getGmailClient = async (userId: string) => {
  const account = await prisma.account.findUnique({
    where: { userId_provider: { userId, provider: 'gmail' } },
  })

  if (!account || !account.isActive) {
    throw new AppError('Gmail not connected. Please connect your Gmail account.', 400)
  }

  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
  })

  // Auto-refresh token if expired
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await prisma.account.update({
        where: { userId_provider: { userId, provider: 'gmail' } },
        data: {
          accessToken: tokens.access_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
      })
      logger.debug('Gmail token refreshed', { userId })
    }
  })

  return google.gmail({ version: 'v1', auth: oauth2Client })
}

// ─── Fetch Recent Emails ──────────────────────────────────
export const fetchRecentEmails = async (userId: string, maxResults = 10) => {
  logger.info('Fetching recent emails', { userId, maxResults })

  const gmail = await getGmailClient(userId)

  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: 'is:unread in:inbox',
  })

  const messages = response.data.messages || []
  const results = []

  for (const msg of messages) {
    try {
      const full = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'full',
      })

      const headers = full.data.payload?.headers || []
      const subject = headers.find(h => h.name === 'Subject')?.value || ''
      const from = headers.find(h => h.name === 'From')?.value || ''
      const date = headers.find(h => h.name === 'Date')?.value || ''

      // Extract email body
      let body = ''
      const parts = full.data.payload?.parts || []
      if (parts.length > 0) {
        const textPart = parts.find(p => p.mimeType === 'text/plain')
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8')
        }
      } else if (full.data.payload?.body?.data) {
        body = Buffer.from(full.data.payload.body.data, 'base64').toString('utf-8')
      }

      // Parse from name and email
      const fromMatch = from.match(/^(.*?)\s*<(.+)>$/)
      const fromName = fromMatch ? fromMatch[1].trim() : from
      const fromEmail = fromMatch ? fromMatch[2] : from

      results.push({
        externalId: msg.id!,
        subject,
        fromName,
        fromEmail,
        body: body.slice(0, 5000), // limit body size
        receivedAt: new Date(date),
      })
    } catch (err) {
      logger.warn('Failed to fetch email', { msgId: msg.id, error: (err as Error).message })
    }
  }

  return results
}

// ─── Process + Store Emails ───────────────────────────────
export const processAndStoreEmails = async (userId: string) => {
  logger.info('Processing emails', { userId })

  const emails = await fetchRecentEmails(userId)
  logger.info('Emails found in Gmail', { count: emails.length })
  let processed = 0

  for (const email of emails) {
    // Skip if already stored
    const existing = await prisma.message.findUnique({
      where: { externalId: email.externalId },
    })
    // if (existing) continue
    if (existing) {
    logger.info('Skipping existing email', { externalId: email.externalId }) 
    continue
  }

    // AI categorize + draft
    const ai = await categorizeAndDraft(
      email.fromName,
      email.fromEmail,
      email.subject,
      email.body
    )

    // Store in DB
    await prisma.message.create({
      data: {
        userId,
        source: 'gmail',
        externalId: email.externalId,
        fromName: email.fromName,
        fromEmail: email.fromEmail,
        subject: email.subject,
        body: email.body,
        category: ai.category,
        priority: ai.priority,
        aiReplyProf: ai.draft,
        receivedAt: email.receivedAt,
      },
    })

    processed++
    logger.info('Email processed', { externalId: email.externalId, category: ai.category })
  }

  return { processed, total: emails.length }
}

// ─── Send Reply ───────────────────────────────────────────
export const sendReply = async (
  userId: string,
  messageId: string,
  replyText: string
) => {
  logger.info('Sending reply', { userId, messageId })

  const gmail = await getGmailClient(userId)

  // Get original message for threading
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  })

  if (!message) throw new AppError('Message not found', 404)

  // Encode email
  const emailLines = [
    `To: ${message.fromEmail}`,
    `Subject: Re: ${message.subject || ''}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    replyText,
  ]
  const email = emailLines.join('\n')
  const encoded = Buffer.from(email).toString('base64url')

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encoded },
  })

  // Update message as replied
  await prisma.message.update({
    where: { id: messageId },
    data: {
      isReplied: true,
      finalReply: replyText,
      repliedAt: new Date(),
    },
  })

  logger.info('Reply sent successfully', { messageId })

  return { message: 'Reply sent successfully' }
}

// ─── Disconnect Gmail ─────────────────────────────────────
export const disconnectGmail = async (userId: string) => {
  await prisma.account.update({
    where: { userId_provider: { userId, provider: 'gmail' } },
    data: { isActive: false },
  })

  logger.info('Gmail disconnected', { userId })
  return { message: 'Gmail disconnected successfully' }
}