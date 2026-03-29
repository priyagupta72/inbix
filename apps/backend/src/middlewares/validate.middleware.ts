import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { sendError } from '../utils/response'

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const message = result.error.issues[0]?.message || 'Validation failed'
      sendError(res, 400, message, 'VALIDATION_ERROR')
      return
    }
    req[source] = result.data
    next()
  }
}