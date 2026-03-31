import { Request, Response } from 'express'
import * as service from './templates.service'

export const getTemplates = async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const templates = await service.getTemplates(userId)
  res.json({ status: 'success', data: { templates } })
}

export const createTemplate = async (req: Request, res: Response) => {
  const userId = (req as any).userId
  const { category, trigger, content } = req.body
  const template = await service.createTemplate(userId, { category, trigger, content })
  res.json({ status: 'success', data: { template } })
}

export const deleteTemplate = async (req: Request, res: Response) => {
  const userId = (req as any).userId
  await service.deleteTemplate(req.params.id as string, userId)
  res.json({ status: 'success', message: 'Template deleted' })
}

export const useTemplate = async (req: Request, res: Response) => {
  await service.useTemplate(req.params.id as string)
  res.json({ status: 'success' })
}