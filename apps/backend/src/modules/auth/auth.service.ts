import bcrypt from 'bcryptjs'
import { OAuth2Client } from 'google-auth-library'
import * as authRepository from './auth.repository'
import {
  generateTokenPair,
  generateEmailVerificationToken,
  verifyEmailVerificationToken,
  verifyPasswordResetToken,
  generatePasswordResetToken,
  hashRefreshToken,
  calculateRefreshTokenExpiry,
  verifyRefreshToken,
} from '../../utils/jwt.utils'
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from '../../utils/email.service'
import { AppError } from '../../utils/AppError'
import logger from '../../utils/logger'
import { prisma } from '../../index'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID!)

// ==================== REGISTER ====================

// ==================== REGISTER ====================

export const register = async (data: {
  name: string
  email: string
  password: string
}) => {
  const { name, email, password } = data

  logger.info('Registration request', { email })

  const existingUser = await authRepository.findUserByEmail(email)

  // Already verified â†’ block registration
  if (existingUser?.isVerified) {
    throw new AppError('Email already registered. Please login.', 409)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  let user

  if (existingUser) {
    // Unverified user exists â†’ update details and resend
    user = await prisma.user.update({
      where: { id: existingUser.id },
      data: { name, passwordHash, updatedAt: new Date() },
    })
    logger.info('Updating existing unverified user', { userId: user.id })
  } else {
    // Brand new user â†’ create
    user = await authRepository.createUser({
      name,
      email,
      passwordHash,
      isVerified: false,
    })
    logger.info('New user created', { userId: user.id })
  }

  await sendVerificationEmail(user)

  // DEV ONLY: print token to terminal for easy testing
  if (process.env.NODE_ENV === 'development') {
    const token = generateEmailVerificationToken(user)
    logger.info('DEV - Verification link', {
      url: `${process.env.FRONTEND_URL}/verify-email?token=${token}`,
      token,
    })
  }

  logger.info('Registration successful â€” verification email sent', { userId: user.id })

  return {
    message: 'Verification email sent. Please check your inbox.',
    email: user.email,
  }
}

// ==================== VERIFY EMAIL ====================

export const verifyEmail = async (token: string) => {
  logger.info('Email verification attempt')

  let decoded: { userId: string; email: string }
  try {
    decoded = verifyEmailVerificationToken(token) as { userId: string; email: string }
  } catch {
    throw new AppError('Invalid or expired verification token', 400)
  }

  const user = await authRepository.findUserById(decoded.userId)

  if (!user) throw new AppError('User not found', 404)

  if (user.isVerified) {
    return { message: 'Email already verified. Please login.', alreadyVerified: true }
  }

  const verifiedUser = await authRepository.markUserAsVerified(user.id)

  sendWelcomeEmail(verifiedUser).catch((err) =>
    logger.error('Welcome email failed', { userId: user.id, error: err.message })
  )

  const { accessToken, refreshToken } = generateTokenPair(verifiedUser)
  await authRepository.addRefreshToken(
    verifiedUser.id,
    refreshToken,
    calculateRefreshTokenExpiry()
  )

  logger.info('Email verified successfully', { userId: verifiedUser.id })

  return {
    message: 'Email verified successfully. Welcome to ReplyEngine!',
    user: sanitizeUser(verifiedUser),
    tokens: { accessToken, refreshToken },
    alreadyVerified: false,
  }
}

// ==================== RESEND VERIFICATION ====================

export const resendVerificationEmail = async (email: string) => {
  const user = await authRepository.findUserByEmail(email)

  if (!user) throw new AppError('User not found. Please register first.', 404)
  if (user.isVerified) throw new AppError('Email already verified. Please login.', 409)

  await sendVerificationEmail(user)

  return { message: 'Verification email resent. Please check your inbox.' }
}

// ==================== LOGIN ====================

export const loginWithEmail = async (
  email: string,
  password: string,
  ipAddress: string
) => {
  logger.info('Email login attempt', { email })

  const user = await authRepository.findUserByEmail(email)

  // Timing-safe: always compare even if user not found
  const dummyHash = '$2a$12$dummyhashfordummycomparison123456789012'
  const passwordToCheck = user?.passwordHash || dummyHash

  const isValid = await bcrypt.compare(password, passwordToCheck)

  if (!user || !isValid) {
    logger.warn('Login failed - invalid credentials', { email })
    throw new AppError('Invalid email or password', 401)
  }

  if (!user.isVerified) {
    throw new AppError('Please verify your email before logging in.', 401)
  }

  if (!user.isActive) {
    throw new AppError('Account has been deactivated. Please contact support.', 401)
  }

  await authRepository.updateLoginInfo(user.id)

  const { accessToken, refreshToken } = generateTokenPair(user)
  await authRepository.addRefreshToken(user.id, refreshToken, calculateRefreshTokenExpiry())

  logger.info('Email login successful', { userId: user.id })

  return {
    message: 'Login successful',
    user: sanitizeUser(user),
    tokens: { accessToken, refreshToken },
  }
}

// ==================== GOOGLE OAUTH ====================

export const loginWithGoogle = async (accessToken: string, ipAddress: string) => {
  logger.info('Google OAuth login attempt')

  type GoogleUserInfo = {
    email?: string
    name?: string
    sub?: string
    picture?: string
  }

  let payload: GoogleUserInfo

  const res = await fetch(
    `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`
  )

  if (!res.ok) {
    const errBody = await res.text()
    logger.error('Google tokeninfo rejected', { status: res.status, body: errBody })
    throw new AppError(`Invalid Google token: ${res.status} - ${errBody}`, 401)
  }

  payload = await res.json() as GoogleUserInfo
  logger.info('Google tokeninfo received', { email: payload.email })

  // ↑ STOP HERE — delete everything from the second "if (!res.ok)" down to here ↑

  if (!payload?.email) throw new AppError('Google token missing email', 401)

  const { email, name, sub: googleId } = payload

  let user = await authRepository.findUserByEmail(email)
  let isNewUser = false

  if (!user) {
    user = await authRepository.createUser({
      email,
      name: name || email.split('@')[0],
      isVerified: true,
    })
    isNewUser = true

    sendWelcomeEmail(user).catch((err) =>
      logger.error('Welcome email failed', { userId: user!.id, error: err.message })
    )

    logger.info('New user created via Google OAuth', { userId: user.id })
  } else if (!user.isVerified) {
    user = await authRepository.markUserAsVerified(user.id)
  }

  await authRepository.updateLoginInfo(user.id)

  const { accessToken: newAccessToken, refreshToken } = generateTokenPair(user)
  await authRepository.addRefreshToken(user.id, refreshToken, calculateRefreshTokenExpiry())

  logger.info('Google OAuth login successful', { userId: user.id, isNewUser })

  return {
    message: isNewUser ? 'Account created successfully' : 'Login successful',
    user: sanitizeUser(user),
    tokens: { accessToken: newAccessToken, refreshToken },
    isNewUser,
  }
}
// ==================== PASSWORD MANAGEMENT ====================

export const forgotPassword = async (email: string) => {
  logger.info('Forgot password request', { email })

  const user = await authRepository.findUserByEmail(email)

  // Security: always return same message whether user exists or not
  if (!user || !user.isVerified) {
    return {
      message: 'If an account with this email exists, you will receive a reset link.',
    }
  }

  await sendPasswordResetEmail(user)
    if (process.env.NODE_ENV === 'development') {
    const resetToken = generatePasswordResetToken(user)
    logger.info('DEV - Password reset link', {
      url: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      token: resetToken,
    })
  }

  logger.info('Password reset email sent', { userId: user.id })

  return { message: 'If an account with this email exists, you will receive a reset link.' }
}

export const resetPassword = async (token: string, newPassword: string) => {
  logger.info('Password reset attempt')

  let decoded: { userId: string }
  try {
    decoded = verifyPasswordResetToken(token) as { userId: string }
  } catch {
    throw new AppError('Invalid or expired reset token', 400)
  }

  const user = await authRepository.findUserById(decoded.userId)
  if (!user) throw new AppError('User not found', 404)

  await authRepository.updatePassword(user.id, newPassword)
  await authRepository.removeAllRefreshTokens(user.id)

  logger.info('Password reset successful', { userId: user.id })

  return { message: 'Password reset successfully. Please login with your new password.' }
}

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.passwordHash) throw new Error('User not found')
  
  const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isValid) throw new Error('Current password is incorrect')

  const hash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } })

  return { message: 'Password updated successfully' }
}

export const validateResetToken = async (token: string) => {
  let decoded: { userId: string }
  try {
    decoded = verifyPasswordResetToken(token) as { userId: string }
  } catch {
    throw new AppError('Invalid or expired reset token', 400)
  }

  const user = await authRepository.findUserById(decoded.userId)
  if (!user) throw new AppError('User not found', 404)

  return { message: 'Token is valid', email: user.email }
}

// ==================== TOKEN MANAGEMENT ====================

export const refreshAccessToken = async (refreshToken: string) => {
  let decoded: { userId: string }
  try {
    decoded = verifyRefreshToken(refreshToken) as { userId: string }
  } catch {
    throw new AppError('Invalid refresh token', 401)
  }

  const user = await authRepository.findUserById(decoded.userId)
  if (!user) throw new AppError('User not found', 401)

  const tokenRecord = await authRepository.findRefreshToken(user.id, refreshToken)
  if (!tokenRecord) throw new AppError('Invalid or expired refresh token', 401)

  const { accessToken } = generateTokenPair(user)

  logger.debug('Access token refreshed', { userId: user.id })

  return { accessToken, message: 'Token refreshed successfully' }
}

// ==================== LOGOUT ====================

export const logout = async (userId: string, refreshToken: string) => {
  await authRepository.removeRefreshToken(userId, refreshToken)
  logger.info('User logged out', { userId })
  return { message: 'Logout successful' }
}

export const logoutAllDevices = async (userId: string) => {
  await authRepository.removeAllRefreshTokens(userId)
  logger.info('User logged out from all devices', { userId })
  return { message: 'Logged out from all devices successfully' }
}

// ==================== HELPERS ====================

const sanitizeUser = (user: {
  id: string
  email: string
  name: string | null
  businessName: string | null
  tonePreference: string
  passwordHash: string | null
  isVerified: boolean
  createdAt: Date
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  businessName: user.businessName,
  tonePreference: user.tonePreference,
   hasPassword: !!user.passwordHash,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
})
