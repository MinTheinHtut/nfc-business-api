import { Router } from 'express';
import { confirmCompanyContact, getCompanyByToken } from '../controllers/public-company.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/:token', getCompanyByToken);
router.post('/:token/confirm', requireAuth, confirmCompanyContact);

export default router;
