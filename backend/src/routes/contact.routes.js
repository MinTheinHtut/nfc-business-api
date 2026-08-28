import { Router } from 'express';
import { getConfirmedContact, listConfirmedContacts } from '../controllers/contact.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/', requireAuth, listConfirmedContacts);
router.get('/:id', requireAuth, getConfirmedContact);
export default router;
