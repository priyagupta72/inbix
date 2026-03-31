import { Router, IRouter } from 'express'
import { getSettings, updateSettings } from './settings.controller'
import { authenticate } from '../../middlewares/auth.middleware'

const router: IRouter = Router()

router.get('/',   authenticate, getSettings)
router.patch('/', authenticate, updateSettings)

export default router