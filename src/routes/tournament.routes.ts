import { Router } from 'express';
import * as tournamentController from '../controllers/tournament.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Admin: Tournament management
router.get('/', requireAdmin, tournamentController.listTournaments);
router.post('/', requireAdmin, tournamentController.createTournament);
router.get(
  '/:tournamentId/referees',
  requireAdmin,
  tournamentController.getTournamentRefereeAssignments,
);
router.post(
  '/:tournamentId/referees',
  requireAdmin,
  tournamentController.assignTournamentReferee,
);
router.patch(
  '/referees/:assignmentId',
  requireAdmin,
  tournamentController.updateTournamentRefereeAssignment,
);
router.delete(
  '/referees/:assignmentId',
  requireAdmin,
  tournamentController.removeTournamentRefereeAssignment,
);
router.get('/:tournamentId', requireAdmin, tournamentController.getTournamentById);
router.put('/:tournamentId', requireAdmin, tournamentController.updateTournament);
router.post('/:tournamentId/publish', requireAdmin, tournamentController.publishTournament);
router.post('/:tournamentId/ongoing', requireAdmin, tournamentController.markTournamentOngoing);
router.post('/:tournamentId/complete', requireAdmin, tournamentController.completeTournament);
router.get('/:tournamentId/standings', requireAdmin, tournamentController.getTournamentStandings);

export default router;

