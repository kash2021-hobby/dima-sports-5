import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All routes require admin access
router.use(authenticateToken);
router.use(requireAdmin);

// User Management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:userId', adminController.updateUser);
router.get('/users/:userId', adminController.getUserDashboard);

// Referee Management
router.post('/referees', adminController.createReferee);
router.get('/referees', adminController.getAllReferees);
router.patch('/referees/:userId', adminController.updateReferee);

// Coach Management (direct account creation)
router.post('/coaches', adminController.createCoach);

// Players
router.get('/players', adminController.getAllPlayers);
router.post('/players/sync-photos', adminController.syncPlayerPhotos);
router.get('/players/:playerId', adminController.getPlayerProfile);

// Dashboard stats (admin)
router.get('/dashboard-stats', adminController.getDashboardStats);

// Application Approval
router.get('/applications', adminController.getAllApplications);
router.get('/approvals/pending', adminController.getPendingApprovals);
router.post('/applications/:applicationId/approve', adminController.approveApplication);
router.post('/applications/:applicationId/reject', adminController.rejectApplication);
router.post('/applications/:applicationId/hold', adminController.holdApplication);

// Document Verification
router.get('/documents/pending', adminController.getPendingDocuments);
router.post('/documents/:documentId/verify', adminController.verifyDocument);

// Team Requests / Notifications
router.get('/team-requests', adminController.getTeamRequests);
router.post('/team-requests/:requestId/approve', adminController.approveTeamRequest);
router.post('/team-requests/:requestId/reject', adminController.rejectTeamRequest);

export default router;
