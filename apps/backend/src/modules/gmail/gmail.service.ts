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

  await prisma.account.upsert({
    where: { userId_provider: { userId, provider: 'gmail' } },
    update: {
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiresAt:    tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      isActive:     true,
    },
    create: {
      userId,
      provider:     'gmail',
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token || '',
      expiresAt:    tokens.expiry_date ? new Date(tokens.expiry_date) : null,
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
    access_token:  account.accessToken,
    refresh_token: account.refreshToken,
  })

  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await prisma.account.update({
        where: { userId_provider: { userId, provider: 'gmail' } },
        data: {
          accessToken: tokens.access_token,
          expiresAt:   tokens.expiry_date ? new Date(tokens.expiry_date) : null,
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
    userId:     'me',
    maxResults,
    q:          'is:unread in:inbox',
  })

  const messages = response.data.messages || []
  const results  = []

  for (const msg of messages) {
    try {
      const full = await gmail.users.messages.get({
        userId: 'me',
        id:     msg.id!,
        format: 'full',
      })

      const headers   = full.data.payload?.headers || []
      const getHeader = (name: string) =>
        headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || ''

      const subject      = getHeader('Subject')
      const from         = getHeader('From')
      const date         = getHeader('Date')
      const rawMessageId = getHeader('Message-ID')
      const threadId     = full.data.threadId || ''

      let body  = ''
      const parts = full.data.payload?.parts || []
      if (parts.length > 0) {
        const textPart = parts.find(p => p.mimeType === 'text/plain')
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8')
        }
      } else if (full.data.payload?.body?.data) {
        body = Buffer.from(full.data.payload.body.data, 'base64').toString('utf-8')
      }

      const fromMatch = from.match(/^(.*?)\s*<(.+)>$/)
      const fromName  = fromMatch ? fromMatch[1].trim() : from
      const fromEmail = fromMatch ? fromMatch[2] : from

      results.push({
        externalId:   msg.id!,
        threadId,
        rawMessageId,
        subject,
        fromName,
        fromEmail,
        body:       body.slice(0, 5000),
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

  // ✅ Fetch user context ONCE before processing all emails
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { name: true, businessName: true },
  })
  const senderName   = user?.name         ?? ''
  const businessName = user?.businessName ?? ''

  const emails = await fetchRecentEmails(userId)
  logger.info('Emails found in Gmail', { count: emails.length })
  let processed = 0

  for (const email of emails) {
    const existing = await prisma.message.findUnique({
      where: { externalId: email.externalId },
    })

    if (existing) {
      logger.info('Skipping existing email', { externalId: email.externalId })
      continue
    }

    // ✅ Pass senderName + businessName so initial AI draft is personalised
    const ai = await categorizeAndDraft(
      email.fromName,
      email.fromEmail,
      email.subject,
      email.body,
      senderName,
      businessName
    )

    await prisma.message.create({
      data: {
        userId,
        source:       'gmail',
        externalId:   email.externalId,
        threadId:     email.threadId,
        rawMessageId: email.rawMessageId,
        fromName:     email.fromName,
        fromEmail:    email.fromEmail,
        subject:      email.subject,
        body:         email.body,
        category:     ai.category,
        priority:     ai.priority,
        aiReplyProf:  ai.draft,   // initial draft stored as professional tone
        receivedAt:   email.receivedAt,
      },
    })

    processed++
    logger.info('Email processed', {
      externalId: email.externalId,
      category:   ai.category,
    })
  }

  return { processed, total: emails.length }
}

// ─── Send Reply ───────────────────────────────────────────
export const sendReply = async (
  userId:    string,
  messageId: string,
  replyText: string
) => {
  logger.info('Sending reply', { userId, messageId })

  const gmail = await getGmailClient(userId)

  const message = await prisma.message.findUnique({
    where:   { id: messageId },
    include: { user: true },
  })

  if (!message) throw new AppError('Message not found', 404)

  const senderName  = message.user.name  || 'Support'
  const senderEmail = message.user.email

  const subject = (message.subject || '').toLowerCase().startsWith('re:')
    ? message.subject!
    : `Re: ${message.subject || ''}`

  const quotedDate = message.receivedAt.toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const quotedBody = (message.body || '')
    .split('\n')
    .map(line => `> ${line}`)
    .join('\n')

  const fullBody = [
    replyText.trim(),
    '',
    `On ${quotedDate}, ${message.fromName} <${message.fromEmail}> wrote:`,
    quotedBody,
  ].join('\n')

  const rawEmail = [
    `From: ${senderName} <${senderEmail}>`,
    `To: ${message.fromName} <${message.fromEmail}>`,
    `Subject: ${subject}`,
    `In-Reply-To: ${message.rawMessageId || ''}`,
    `References: ${message.rawMessageId || ''}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `MIME-Version: 1.0`,
    '',
    fullBody,
  ].join('\r\n')

  const encoded = Buffer.from(rawEmail)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw:      encoded,
      threadId: message.threadId || undefined,
    },
  })

  await prisma.message.update({
    where: { id: messageId },
    data: {
      isReplied:  true,
      finalReply: replyText,
      repliedAt:  new Date(),
    },
  })

  logger.info('Reply sent successfully', { messageId })
  return { message: 'Reply sent successfully' }
}

// ─── Disconnect Gmail ─────────────────────────────────────
export const disconnectGmail = async (userId: string) => {
  await prisma.account.update({
    where: { userId_provider: { userId, provider: 'gmail' } },
    data:  { isActive: false },
  })

  logger.info('Gmail disconnected', { userId })
  return { message: 'Gmail disconnected successfully' }
}