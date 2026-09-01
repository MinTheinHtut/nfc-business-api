import { Router } from 'express';
import { getCurrentUser, login, logout } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { loginRateLimit } from '../middleware/security.middleware.js';

const router = Router();

router.post('/login', loginRateLimit, login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getCurrentUser);

export default router;
