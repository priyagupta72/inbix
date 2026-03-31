import { Request, Response, NextFunction } from 'express'
import { sendSuccess } from '../../utils/response'
import { prisma } from '../../index'

// GET /api/settings
export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { name: true, businessName: true, tonePreference: true }
    })
    sendSuccess(res, 200, 'Settings retrieved', { settings: user })
  } catch (error) {
    next(error)
  }
}

// PATCH /api/settings
export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, businessName, tonePreference } = req.body
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, businessName, tonePreference },
      select: { name: true, businessName: true, tonePreference: true }
    })
    sendSuccess(res, 200, 'Settings updated', { settings: updated })
  } catch (error) {
    next(error)
  }
}