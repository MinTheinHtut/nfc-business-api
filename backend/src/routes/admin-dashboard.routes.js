import { Router } from 'express'; import { getAdminDashboard } from '../controllers/admin-dashboard.controller.js'; import { requireAdmin, requireAuth } from '../middleware/auth.middleware.js';
const router=Router(); router.use(requireAuth,requireAdmin); router.get('/',getAdminDashboard); export default router;
