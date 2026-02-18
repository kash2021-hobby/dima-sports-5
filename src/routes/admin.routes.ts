import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All routes require admin access
router.use(authenticateToken);
router.use(requireAdmin);

// User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserDashboard);

// Players
router.get('/players', adminController.getAllPlayers);
router.get('/players/:playerId', adminController.getPlayerProfile);

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
