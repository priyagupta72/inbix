import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET!
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

// ── Industry standard expiry times ──────────────────────
const ACCESS_EXPIRES            = process.env.JWT_ACCESS_EXPIRES_IN  || '1h'
const REFRESH_EXPIRES           = process.env.JWT_REFRESH_EXPIRES_IN || '7d'
const EMAIL_VERIFY_EXPIRES      = '15m'
const PASSWORD_RESET_EXPIRES    = '15m'

interface TokenPayload {
  userId: string
  email:  string
  iat?:   number
}

export const generateTokenPair = (user: { id: string; email: string }) => {
  const payload = { userId: user.id, email: user.email }

  const accessToken = jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  } as jwt.SignOptions)

  const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  } as jwt.SignOptions)

  return { accessToken, refreshToken }
}

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload
}

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload
}

export const verifyEmailVerificationToken = (token: string): TokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload
}

export const verifyPasswordResetToken = (token: string): TokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload
}

export const generateEmailVerificationToken = (user: {
  id: string
  email: string
}): string => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    ACCESS_SECRET,
    { expiresIn: EMAIL_VERIFY_EXPIRES } as jwt.SignOptions
  )
}

export const generatePasswordResetToken = (user: {
  id: string
  email: string
}): string => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    ACCESS_SECRET,
    { expiresIn: PASSWORD_RESET_EXPIRES } as jwt.SignOptions
  )
}

export const hashRefreshToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export const calculateRefreshTokenExpiry = (): Date => {
  // Must match REFRESH_EXPIRES (7 days)
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
}

export const extractTokenFromHeader = (req: {
  headers: { authorization?: string }
}): string | null => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.split(' ')[1] || null
}