import { prisma } from '../../index'

export const findMessageById = async (id: string, userId: string) => {
  return prisma.message.findFirst({
    where: { id, userId, deletedAt: null },
  })
}

export const findMessages = async (
  userId: string,
  filters: {
    category?: string
    isReplied?: boolean
    isArchived?: boolean
    page?: number
    limit?: number
  } = {}
) => {
  const { category, isReplied, isArchived = false, page = 1, limit = 20 } = filters

  const where = {
    userId,
    deletedAt: null,
    isArchived,
    ...(category && { category }),
    ...(isReplied !== undefined && { isReplied }),
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

  return {
    messages,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export const updateToneReply = async (
  id: string,
  tone: string,
  draft: string
) => {
  const field = `aiReply${tone.charAt(0).toUpperCase() + tone.slice(1)}` as
    | 'aiReplyProf'
    | 'aiReplyFriend'
    | 'aiReplyBrief'
    | 'aiReplyFormal'

  return prisma.message.update({
    where: { id },
    data: { [field]: draft },
  })
}

export const markAsReplied = async (
  id: string,
  finalReply: string,
  toneUsed: string
) => {
  return prisma.message.update({
    where: { id },
    data: {
      isReplied: true,
      finalReply,
      toneUsed,
      repliedAt: new Date(),
    },
  })
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

export const softDelete = async (id: string) => {
  return prisma.message.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

export const bulkMarkAsReplied = async (
  messageIds: string[],
  userId: string
) => {
  return prisma.message.updateMany({
    where: { id: { in: messageIds }, userId },
    data: { isReplied: true, repliedAt: new Date() },
  })
}