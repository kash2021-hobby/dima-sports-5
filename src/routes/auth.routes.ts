import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/signup', authController.signup);
router.post('/verify-otp', authController.verifyOTPCode);
router.post('/setup-mpin', authController.setupMPIN); // Can be used with or without auth
router.post('/login', authController.login);
router.post('/coach-initial-login', authController.coachInitialLogin);
router.post('/resend-otp', authController.resendOTP);

// Protected routes
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/update-mpin', authenticateToken, authController.updateMPIN);
// Allow authenticated users to setup MPIN via profile
router.post('/setup-mpin-authenticated', authenticateToken, authController.setupMPIN);

export default router;
