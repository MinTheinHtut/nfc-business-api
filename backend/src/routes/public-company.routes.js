import { Router } from 'express';
import { confirmCompanyContact, getCompanyByToken } from '../controllers/public-company.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { publicConfirmRateLimit, publicProfileRateLimit } from '../middleware/security.middleware.js';

const router = Router();

router.get('/:token', publicProfileRateLimit, getCompanyByToken);
router.post('/:token/confirm', publicConfirmRateLimit, requireAuth, confirmCompanyContact);

export default router;
