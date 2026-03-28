import { Response } from 'express'

export const sendSuccess = (
  res: Response,
  statusCode: number,
  message: string,
  data?: object
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    ...(data && { data }),
  })
}

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  code?: string
): void => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(code && { code }),
  })
}