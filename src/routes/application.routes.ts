import { Router } from 'express';
import * as applicationController from '../controllers/application.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/create', applicationController.createOrUpdateApplication);
router.put('/update', applicationController.createOrUpdateApplication);
router.get('/my-application', applicationController.getApplication);
router.get('/check-aadhaar', applicationController.checkAadhaar);
router.post('/submit', applicationController.submitApplication);
router.get('/status', applicationController.getApplicationStatus);

export default router;
