import { prisma } from '../../index'
import { hashRefreshToken } from '../../utils/jwt.utils'
import bcrypt from 'bcryptjs'
import logger from '../../utils/logger'

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } })
}

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({ where: { id } })
}

export const findUserByIdWithTokens = async (id: string) => {
  return prisma.user.findUnique({ where: { id } })
}

export const createUser = async (data: {
  email: string
  name?: string
  passwordHash?: string
  isVerified?: boolean
}) => {
  return prisma.user.create({ data })
}

export const markUserAsVerified = async (id: string) => {
  return prisma.user.update({
    where: { id },
    data: { isVerified: true },
  })
}

export const updatePassword = async (id: string, newPassword: string) => {
  const passwordHash = await bcrypt.hash(newPassword, 12)
  return prisma.user.update({
    where: { id },
    data: { passwordHash },
  })
}

export const updateLoginInfo = async (id: string) => {
  return prisma.user.update({
    where: { id },
    data: { lastLoginAt: new Date() },
  })
}

export const addRefreshToken = async (
  userId: string,
  token: string,
  expiresAt: Date
) => {
  const hashed = hashRefreshToken(token)
  return prisma.refreshToken.create({
    data: { userId, token: hashed, expiresAt },
  })
}

export const removeRefreshToken = async (userId: string, token: string) => {
  const hashed = hashRefreshToken(token)
  await prisma.refreshToken.deleteMany({
    where: { userId, token: hashed },
  })
}

export const removeAllRefreshTokens = async (userId: string) => {
  await prisma.refreshToken.deleteMany({ where: { userId } })
  logger.info('All refresh tokens removed', { userId })
}

export const findRefreshToken = async (userId: string, token: string) => {
  const hashed = hashRefreshToken(token)
  return prisma.refreshToken.findFirst({
    where: {
      userId,
      token: hashed,
      expiresAt: { gt: new Date() },
    },
  })
}