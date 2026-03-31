import * as repo from './templates.repository'
import { AppError } from '../../utils/AppError'

export const getTemplates = async (userId: string) => {
  return repo.findTemplates(userId)
}

export const createTemplate = async (userId: string, data: {
  category: string; trigger: string; content: string
}) => {
  if (!data.category || !data.trigger || !data.content) {
    throw new AppError('All fields required', 400)
  }
  return repo.createTemplate(userId, data)
}

export const deleteTemplate = async (id: string, userId: string) => {
  await repo.softDeleteTemplate(id, userId)
}

export const useTemplate = async (id: string) => {
  await repo.incrementUseCount(id)
}