import { Router } from 'express';
import * as documentController from '../controllers/document.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/upload', documentController.upload.single('file'), documentController.uploadDocument);
router.get('/my-documents', documentController.getMyDocuments);
router.get('/files/:fileKey', documentController.downloadDocumentFile);
router.get('/:id', documentController.getDocument);

export default router;
