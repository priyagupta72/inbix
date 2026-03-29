import { Request, Response, NextFunction } from 'express'
import * as gmailService from './gmail.service'
import { sendSuccess } from '../../utils/response'
import logger from '../../utils/logger'

export const getAuthUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const url = gmailService.getAuthUrl(userId)
    sendSuccess(res, 200, 'Gmail auth URL generated', { url })
  } catch (error) {
    next(error)
  }
}

export const connectGmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state: userId } = req.query as { code: string; state: string }
    const result = await gmailService.connectGmail(userId, code)
    sendSuccess(res, 200, result.message)
  } catch (error) {
    next(error)
  }
}

export const fetchEmails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const result = await gmailService.processAndStoreEmails(userId)
    sendSuccess(res, 200, `Processed ${result.processed} new emails`, result)
  } catch (error) {
    next(error)
  }
}

export const sendReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const messageId = req.params.messageId as string
    const { replyText } = req.body
    const result = await gmailService.sendReply(userId, messageId, replyText)
    sendSuccess(res, 200, result.message)
  } catch (error) {
    next(error)
  }
}

export const disconnectGmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const result = await gmailService.disconnectGmail(userId)
    sendSuccess(res, 200, result.message)
  } catch (error) {
    next(error)
  }
}