import { Router } from 'express';
import { listConfirmedContacts } from '../controllers/contact.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', requireAuth, listConfirmedContacts);
export default router;
