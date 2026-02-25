import { Router } from 'express';
import * as coachController from '../controllers/coach.controller';
import * as tournamentController from '../controllers/tournament.controller';
import { authenticateToken, requireAdmin, requireCoach } from '../middleware/auth.middleware';

const router = Router();

// Public routes (for coach verification)
router.get('/invite/:inviteToken', coachController.getInviteByToken);
router.post('/verify-otp', coachController.verifyCoachOTP);
router.post('/setup-mpin', coachController.setupCoachMPIN);

// Coach routes
router.get('/profile', authenticateToken, requireCoach, coachController.getCoachProfile);
router.get('/my-players', authenticateToken, requireCoach, coachController.getMyPlayers);
router.get('/players/:playerId', authenticateToken, requireCoach, coachController.getPlayerProfileForCoach);

// Coach: Tournament hub
router.get(
  '/tournaments/announcements',
  authenticateToken,
  requireCoach,
  tournamentController.getCoachTournamentAnnouncements,
);
router.post(
  '/tournaments/:tournamentId/apply',
  authenticateToken,
  requireCoach,
  tournamentController.submitTournamentApplication,
);

// Admin routes
router.post('/:coachId/activate', authenticateToken, requireAdmin, coachController.activateCoach);
router.get('/all', authenticateToken, requireAdmin, coachController.getAllCoaches);

export default router;
