import { Router } from 'express';
import { confirmCompanyContact, getCompanyByToken } from '../controllers/public-company.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { publicConfirmRateLimit, publicProfileRateLimit } from '../middleware/security.middleware.js';
import { connectVisitorToCompany } from '../controllers/public-visitor.controller.js';

const router = Router();

router.get('/:token', publicProfileRateLimit, getCompanyByToken);
router.post('/:token/confirm', publicConfirmRateLimit, requireAuth, confirmCompanyContact);
router.post('/:token/connect', publicConfirmRateLimit, connectVisitorToCompany);

export default router;
