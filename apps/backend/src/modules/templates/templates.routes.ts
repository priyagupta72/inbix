import { Router, IRouter } from 'express'
import { authenticate } from '../../middlewares/auth.middleware'
import * as ctrl from './templates.controller'

const router: IRouter = Router()
router.use(authenticate)

router.get('/',           ctrl.getTemplates)
router.post('/',          ctrl.createTemplate)
router.delete('/:id',     ctrl.deleteTemplate)
router.patch('/:id/use',  ctrl.useTemplate)

export default router