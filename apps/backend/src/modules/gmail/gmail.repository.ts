import { prisma } from '../../index'
import logger from '../../utils/logger'

export const findMessageByExternalId = async (externalId: string) => {
  return prisma.message.findUnique({ where: { externalId } })
}

export const createMessage = async (data: {
  userId: string
  source: string
  externalId: string
  fromName: string
  fromEmail?: string
  subject?: string
  body: string
  category: string
  priority: number
  aiReplyProf?: string
  receivedAt: Date
}) => {
  return prisma.message.create({ data })
}

export const updateMessageReply = async (
  id: string,
  data: {
    isReplied: boolean
    finalReply: string
    toneUsed?: string
    repliedAt: Date
  }
) => {
  return prisma.message.update({ where: { id }, data })
}

export const findMessagesByUserId = async (
  userId: string,
  filters: {
    category?: string
    isReplied?: boolean
    isArchived?: boolean
    page?: number
    limit?: number
  } = {}
) => {
  const { category, isReplied, isArchived, page = 1, limit = 20 } = filters

  const where = {
    userId,
    deletedAt: null,
    ...(category && { category }),
    ...(isReplied !== undefined && { isReplied }),
    ...(isArchived !== undefined && { isArchived }),
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { receivedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.message.count({ where }),
  ])

  return { messages, total, page, limit }
}

export const archiveMessage = async (id: string) => {
  return prisma.message.update({
    where: { id },
    data: { isArchived: true },
  })
}

export const markAsRead = async (id: string) => {
  return prisma.message.update({
    where: { id },
    data: { isRead: true },
  })
}

export const softDeleteMessage = async (id: string) => {
  return prisma.message.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}