import { Router } from 'express';
import {
  createCompany,
  deactivateCompany,
  getCompany,
  listCompanies,
  updateCompany,
} from '../controllers/admin-company.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth, requireAdmin);
router.get('/', listCompanies);
router.get('/:id', getCompany);
router.post('/', createCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deactivateCompany);

export default router;
