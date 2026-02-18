import { Router } from 'express';
import * as trialController from '../controllers/trial.controller';
import { authenticateToken, requireAdmin, requireCoach } from '../middleware/auth.middleware';

const router = Router();

// Coach routes
router.get('/my-trials', authenticateToken, requireCoach, trialController.getMyTrials);
router.post('/:trialId/evaluate', authenticateToken, requireCoach, trialController.evaluateTrial);

// Admin routes
router.post('/assign', authenticateToken, requireAdmin, trialController.assignTrial);
router.get('/all', authenticateToken, requireAdmin, trialController.getAllTrials);

export default router;
