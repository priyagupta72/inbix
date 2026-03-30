import { Request, Response, NextFunction } from 'express'
import * as authService from './auth.service'
import { sendSuccess } from '../../utils/response'
import logger from '../../utils/logger'

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body
    logger.info('Register request', { email, ip: req.ip })
    const result = await authService.register({ name, email, password })
    sendSuccess(res, 200, result.message, result)
  } catch (error) {
    next(error)
  }
}

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query as { token: string }
    const result = await authService.verifyEmail(token)
    sendSuccess(res, 200, result.message, result)
  } catch (error) {
    next(error)
  }
}

export const resendVerificationEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body
    const result = await authService.resendVerificationEmail(email)
    sendSuccess(res, 200, result.message)
  } catch (error) {
    next(error)
  }
}
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user!.id
    const result = await authService.changePassword(userId, currentPassword, newPassword)
    sendSuccess(res, 200, result.message)
  } catch (error) {
    next(error)
  }
}

export const loginWithEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body
    logger.info('Login request', { email, ip: req.ip })
    const result = await authService.loginWithEmail(email, password, req.ip || '')
    sendSuccess(res, 200, result.message, result)
  } catch (error) {
    next(error)
  }
}

export const loginWithGoogle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessToken } = req.body  // ← was wrongly "userInfo"

    if (!accessToken) {
      return next(new Error('accessToken is missing from request body'))
    }

    const result = await authService.loginWithGoogle(accessToken, req.ip || '')
    const statusCode = result.isNewUser ? 201 : 200
    sendSuccess(res, statusCode, result.message, result)
  } catch (error) {
    next(error)
  }
}

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body
    const result = await authService.forgotPassword(email)
    sendSuccess(res, 200, result.message)
  } catch (error) {
    next(error)
  }
}

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body
    const result = await authService.resetPassword(token, password)
    sendSuccess(res, 200, result.message)
  } catch (error) {
    next(error)
  }
}

export const validateResetToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.params.token as string
    const result = await authService.validateResetToken(token)
    sendSuccess(res, 200, result.message, result)
  } catch (error) {
    next(error)
  }
}

export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body
    const result = await authService.refreshAccessToken(refreshToken)
    sendSuccess(res, 200, result.message, result)
  } catch (error) {
    next(error)
  }
}

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, 200, 'User profile retrieved', { user: req.user })
  } catch (error) {
    next(error)
  }
}

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body
    const userId = req.user!.id
    const result = await authService.logout(userId, refreshToken)
    sendSuccess(res, 200, result.message)
  } catch (error) {
    next(error)
  }
}

export const logoutAllDevices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const result = await authService.logoutAllDevices(userId)
    sendSuccess(res, 200, result.message)
  } catch (error) {
    next(error)
  }
}