import { Router } from 'express'; import { exportConfirmationsCsv,listConfirmations } from '../controllers/admin-confirmation.controller.js'; import { requireAdmin,requireAuth } from '../middleware/auth.middleware.js';
const router=Router();router.use(requireAuth,requireAdmin);router.get('/export.csv',exportConfirmationsCsv);router.get('/',listConfirmations);export default router;
