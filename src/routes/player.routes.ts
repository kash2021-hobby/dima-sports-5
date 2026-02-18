import { Router } from 'express';
import * as playerController from '../controllers/player.controller';
import { authenticateToken, requirePlayer } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Player profile routes
router.get('/profile', requirePlayer, playerController.getPlayerProfile);
router.put('/profile/personal', requirePlayer, playerController.updatePersonalProfile);
router.put('/profile/medical', requirePlayer, playerController.updateMedicalInfo);
router.get('/documents', requirePlayer, playerController.getPlayerDocuments);
router.get('/eligibility', requirePlayer, playerController.getEligibilityStatus);

export default router;
