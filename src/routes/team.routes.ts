import { Router } from 'express';
import * as teamController from '../controllers/team.controller';
import { authenticateToken, requireAdmin, requireCoach } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Public team utilities (for all authenticated users)
router.get('/active', teamController.getActiveTeams);

// Coach: My Teams module
router.get('/coach/my-teams', requireCoach, teamController.getMyTeams);
router.post('/coach/my-teams', requireCoach, teamController.createTeamForCoach);
router.put('/coach/my-teams/:teamId', requireCoach, teamController.updateMyTeam);
router.delete('/coach/my-teams/:teamId', requireCoach, teamController.deleteMyTeam);

// Admin: Teams module
router.get('/admin', requireAdmin, teamController.adminGetAllTeams);
router.get('/admin/:teamId', requireAdmin, teamController.adminGetTeamDetail);
router.put('/admin/:teamId', requireAdmin, teamController.adminUpdateTeam);
router.delete('/admin/:teamId', requireAdmin, teamController.adminDeleteTeam);
router.get('/admin/:teamId/players', requireAdmin, teamController.adminGetTeamPlayers);

export default router;

