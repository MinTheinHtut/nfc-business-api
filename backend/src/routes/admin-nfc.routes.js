import { Router } from 'express';
import { createNfcTag, listNfcTags, updateNfcTag } from '../controllers/admin-nfc.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/', listNfcTags);
router.post('/', createNfcTag);
router.put('/:id', updateNfcTag);

export default router;
