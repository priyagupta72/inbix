import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt.utils'
import { findUserById } from '../modules/auth/auth.repository'
import { AppError } from '../utils/AppError'
import { sendError } from '../utils/response'
import logger from '../utils/logger'

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req)

    if (!token) throw new AppError('Authentication required', 401)

    const decoded = verifyAccessToken(token) as { userId: string }

    const user = await findUserById(decoded.userId)

    if (!user) throw new AppError('User not found', 401)
    if (!user.isActive) throw new AppError('Account has been deactivated', 401)
    if (!user.isVerified) throw new AppError('Email verification required', 401)

    req.user = user
    req.userId = user.id

    logger.debug('Auth successful', { userId: user.id, path: req.path })

    next()
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.statusCode, error.message)
      return
    }
    if ((error as Error).name === 'TokenExpiredError') {
      sendError(res, 401, 'Session expired. Please login again.')
      return
    }
    sendError(res, 401, 'Invalid authentication credentials')
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any
      userId?: string
    }
  }
}