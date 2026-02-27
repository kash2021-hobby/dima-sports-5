import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import prisma from '../config/database';
import { config } from '../config/env';
import { notifyDocumentVerification } from '../services/notification.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { uploadFile, getPresignedUrl, getDriveFileStream } from '../services/storage.service';

// Configure multer for file uploads (memory storage, files kept in-memory as Buffer)
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  if (config.allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${ext} not allowed. Allowed types: ${config.allowedFileTypes.join(', ')}`));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter,
});

/**
 * Upload document
 */
export async function uploadDocument(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { documentType, ownerType, notes } = req.body;

    if (!documentType || !ownerType) {
      res.status(400).json({ success: false, message: 'documentType and ownerType are required' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'File is required' });
      return;
    }

    // Determine ownerId based on ownerType
    let ownerId: string;
    
    if (ownerType === 'PLAYER_APPLICATION') {
      const application = await prisma.playerApplication.findUnique({
        where: { userId: req.userId },
      });
      
      if (!application) {
        res.status(404).json({ success: false, message: 'Application not found' });
        return;
      }
      
      ownerId = application.id;
    } else if (ownerType === 'PLAYER') {
      const player = await prisma.player.findUnique({
        where: { userId: req.userId },
      });
      
      if (!player) {
        res.status(404).json({ success: false, message: 'Player profile not found' });
        return;
      }
      
      ownerId = player.id;
    } else {
      res.status(400).json({ success: false, message: 'Invalid ownerType' });
      return;
    }

    // Upload file to S3-compatible storage and store key in DB
    const key = `${ownerType}/${Date.now()}-${req.file.originalname}`;
    const uploadedKey = await uploadFile(req.file.buffer, key, req.file.mimetype);

    const document = await prisma.document.create({
      data: {
        ownerType,
        ownerId,
        documentType,
        fileUrl: uploadedKey,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        // Admin verification is currently disabled; treat upload as verified
        verificationStatus: 'VERIFIED',
        verifiedBy: req.userId,
        verifiedAt: new Date(),
        notes: typeof notes === 'string' ? notes : null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { document },
    });
  } catch (error: any) {
    console.error('Upload document error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document', error: error.message });
  }
}

/**
 * Get user's documents
 */
export async function getMyDocuments(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Get application or player ID
    const application = await prisma.playerApplication.findUnique({
      where: { userId: req.userId },
      select: { id: true },
    });

    const player = await prisma.player.findUnique({
      where: { userId: req.userId },
      select: { id: true },
    });

    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { ownerType: 'PLAYER_APPLICATION', ownerId: application?.id || '' },
          { ownerType: 'PLAYER', ownerId: player?.id || '' },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const documentsWithSignedUrls = await Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        fileUrl: await getPresignedUrl(doc.fileUrl),
      })),
    );

    res.json({
      success: true,
      data: { documents: documentsWithSignedUrls },
    });
  } catch (error: any) {
    console.error('Get documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to get documents', error: error.message });
  }
}

/**
 * Get document by ID
 */
export async function getDocument(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        verifiedByUser: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
    });

    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    // Check ownership (user can only see their own documents)
    const application = await prisma.playerApplication.findUnique({
      where: { userId: req.userId },
      select: { id: true },
    });

    const player = await prisma.player.findUnique({
      where: { userId: req.userId },
      select: { id: true },
    });

    const isAuthorized =
      document.ownerId === application?.id ||
      document.ownerId === player?.id ||
      req.userRole === 'ADMIN' ||
      req.userRole === 'COACH';

    if (!isAuthorized) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const signedUrl = await getPresignedUrl(document.fileUrl);

    res.json({
      success: true,
      data: { document: { ...document, fileUrl: signedUrl } },
    });
  } catch (error: any) {
    console.error('Get document error:', error);
    res.status(500).json({ success: false, message: 'Failed to get document', error: error.message });
  }
}

/**
 * Download document file (proxied via backend from Google Drive)
 */
export async function downloadDocumentFile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { fileKey } = req.params;

    // eslint-disable-next-line no-console
    console.log('[downloadDocumentFile] Incoming fileKey param:', fileKey);

    const document = await prisma.document.findFirst({
      where: { fileUrl: fileKey },
    });

    // eslint-disable-next-line no-console
    console.log('[downloadDocumentFile] Document lookup where clause:', {
      field: 'fileUrl',
      valueSearched: fileKey,
    });

    if (!document) {
      // eslint-disable-next-line no-console
      console.warn('[downloadDocumentFile] No document found for given fileKey.', {
        searchedField: 'fileUrl',
        valueSearched: fileKey,
      });
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    // eslint-disable-next-line no-console
    console.log('[downloadDocumentFile] Found document from DB:', document);
    // eslint-disable-next-line no-console
    console.log('[downloadDocumentFile] Stored values in DB for fileUrl (Drive file identifier):', {
      documentId: document.id,
      fileUrlColumnValue: document.fileUrl,
      fileName: document.fileName,
      mimeType: document.mimeType,
    });

    const application = await prisma.playerApplication.findUnique({
      where: { userId: req.userId },
      select: { id: true },
    });

    const player = await prisma.player.findUnique({
      where: { userId: req.userId },
      select: { id: true },
    });

    if (
      document.ownerId !== application?.id &&
      document.ownerId !== player?.id &&
      req.userRole !== 'ADMIN' &&
      req.userRole !== 'COACH'
    ) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // eslint-disable-next-line no-console
    console.log('[downloadDocumentFile] Streaming file from Drive using fileKey (interpreted as Drive fileId):', fileKey);

    const stream = await getDriveFileStream(fileKey);

    const mimeType = document.mimeType || 'application/octet-stream';
    const fileName = document.fileName || 'document';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);

    stream.on('error', (err) => {
      console.error('Stream document error:', err);
      if (!res.headersSent) {
        res.status(500).end('Failed to read file');
      } else {
        res.end();
      }
    });

    stream.pipe(res);
  } catch (error: any) {
    console.error('Download document file error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to download document', error: error.message });
    } else {
      res.end();
    }
  }
}
