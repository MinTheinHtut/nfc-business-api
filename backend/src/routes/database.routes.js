import { Router } from 'express';
import { testDatabase } from '../controllers/database.controller.js';

const router = Router();

// Temporary Phase 2 route used to verify the local MySQL connection.
router.get('/db-test', testDatabase);

export default router;
