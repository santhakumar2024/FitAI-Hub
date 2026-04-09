// src/routes/profile.routes.ts
import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);
router.get('/profile/me', profileController.getMyProfile);
router.patch('/profile/me', profileController.updateMyProfile);

export default router;
