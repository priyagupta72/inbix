import { Request, Response, NextFunction } from 'express'
import * as messagesService from './messages.service'
import { sendSuccess } from '../../utils/response'

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
const { category, isReplied, isArchived, page, limit } = req.query as any
const isArchivedBool = isArchived === "true" ? true : isArchived === "false" ? false : undefined
const isRepliedBool  = isReplied  === "true" ? true : isReplied  === "false" ? false : undefined
const result = await messagesService.getMessages(userId, {
  category,
  isReplied:  isRepliedBool,
  isArchived: isArchivedBool,
  page:  Number(page)  || 1,
  limit: Number(limit) || 20,
})
    sendSuccess(res, 200, 'Messages retrieved', result)
  } catch (error) {
    next(error)
  }
}

export const getMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const id = req.params.id as string
    const result = await messagesService.getMessage(id, userId)
    sendSuccess(res, 200, 'Message retrieved', result)
  } catch (error) {
    next(error)
  }
}

export const getToneVariant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const id = req.params.id as string
    const tone = req.params.tone as string
    const result = await messagesService.getToneVariant(id, userId, tone)
    sendSuccess(res, 200, 'Tone variant retrieved', result)
  } catch (error) {
    next(error)
  }
}

export const sendReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const id = req.params.id as string
    const { replyText, tone } = req.body
    const result = await messagesService.sendReply(id, userId, replyText, tone)
    sendSuccess(res, 200, result.message)
  } catch (error) {
    next(error)
  }
}

export const bulkSendReplies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const { messageIds } = req.body
    const result = await messagesService.bulkSendReplies(userId, messageIds)
    sendSuccess(res, 200, `Sent ${result.sent} replies`, result)
  } catch (error) {
    next(error)
  }
}

export const archiveMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const id = req.params.id as string
    const result = await messagesService.archiveMessage(id, userId)
    sendSuccess(res, 200, result.message)
  } catch (error) {
    next(error)
  }
}

export const regenerateDraft = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const id = req.params.id as string
    const { tone } = req.body
    const result = await messagesService.regenerateDraft(id, userId, tone)
    sendSuccess(res, 200, 'Draft regenerated', result)
  } catch (error) {
    next(error)
  }
}