import { prisma } from '../../index'

export const findTemplates = async (userId: string) => {
  return prisma.template.findMany({
    where:   { userId, isActive: true },
    orderBy: { createdAt: 'desc' },
  })
}

export const createTemplate = async (
  userId: string,
  data: { category: string; trigger: string; content: string }
) => {
  return prisma.template.create({
    data: { userId, ...data, isActive: true },
  })
}

export const softDeleteTemplate = async (id: string, userId: string) => {
  return prisma.template.updateMany({
    where: { id, userId },
    data:  { isActive: false },
  })
}

export const incrementUseCount = async (id: string) => {
  return prisma.template.update({
    where: { id },
    data:  { useCount: { increment: 1 } },
  })
}

/**
 * Find the best matching template for a message.
 * Strategy: category match first, then keyword (trigger) fallback.
 */
export const findMatchingTemplate = async (
  userId:   string,
  category: string,
  subject:  string,
  body:     string
) => {
  const templates = await findTemplates(userId)
  if (!templates.length) return null

  // 1️⃣ Category match
  const categoryMatch = templates.find(
    (t) => t.category.toLowerCase() === category.toLowerCase()
  )
  if (categoryMatch) return categoryMatch

  // 2️⃣ Keyword (trigger) fallback
  const text         = `${subject} ${body}`.toLowerCase()
  const keywordMatch = templates.find(
    (t) => t.trigger && text.includes(t.trigger.toLowerCase())
  )
  return keywordMatch ?? null
}