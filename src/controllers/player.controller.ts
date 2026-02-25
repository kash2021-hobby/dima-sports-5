import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Get player profile (full: Core Football Identity + Personal + Application + Documents)
 * Used by the Player's own Profile module (tabbed view).
 */
export async function getPlayerProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const player = await prisma.player.findUnique({
      where: { userId: req.userId },
      include: {
        user: {
          select: {
            phone: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    if (!player) {
      res.status(404).json({ success: false, message: 'Player profile not found' });
      return;
    }

    const application = await prisma.playerApplication.findUnique({
      where: { userId: req.userId },
    });

    const [playerDocuments, applicationDocuments] = await Promise.all([
      prisma.document.findMany({
        where: { ownerType: 'PLAYER', ownerId: player.id },
        orderBy: { createdAt: 'desc' },
      }),
      application
        ? prisma.document.findMany({
            where: { ownerType: 'PLAYER_APPLICATION', ownerId: application.id },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    const documents = [...playerDocuments, ...applicationDocuments];

    res.json({
      success: true,
      data: {
        player: { ...player, documents: playerDocuments },
        application: application ? { ...application, documents: applicationDocuments } : null,
        documents,
      },
    });
  } catch (error: any) {
    console.error('Get player profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get player profile', error: error.message });
  }
}

/**
 * Update personal profile (editable fields only)
 */
export async function updatePersonalProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { displayName, photo, nickname, city, state, district, nationality, profileVisibility } = req.body;

    const player = await prisma.player.findUnique({
      where: { userId: req.userId },
    });

    if (!player) {
      res.status(404).json({ success: false, message: 'Player profile not found' });
      return;
    }

    // Update only editable fields
    const updatedPlayer = await prisma.player.update({
      where: { userId: req.userId },
      data: {
        displayName,
        photo,
        nickname,
        city,
        state,
        district,
        nationality,
        profileVisibility: profileVisibility || 'PUBLIC',
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { player: updatedPlayer },
    });
  } catch (error: any) {
    console.error('Update personal profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
}

/**
 * Update medical & safety info
 */
export async function updateMedicalInfo(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { bloodGroup, allergies, chronicConditions, injuryStatus, emergencyContactName, emergencyContactPhone, emergencyContactRelation } = req.body;

    const player = await prisma.player.findUnique({
      where: { userId: req.userId },
    });

    if (!player) {
      res.status(404).json({ success: false, message: 'Player profile not found' });
      return;
    }

    const updatedPlayer = await prisma.player.update({
      where: { userId: req.userId },
      data: {
        bloodGroup,
        allergies,
        chronicConditions,
        injuryStatus,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelation,
      },
    });

    res.json({
      success: true,
      message: 'Medical information updated successfully',
      data: { player: updatedPlayer },
    });
  } catch (error: any) {
    console.error('Update medical info error:', error);
    res.status(500).json({ success: false, message: 'Failed to update medical info', error: error.message });
  }
}

/**
 * Get player documents
 */
export async function getPlayerDocuments(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const player = await prisma.player.findUnique({
      where: { userId: req.userId },
      select: { id: true },
    });

    if (!player) {
      res.status(404).json({ success: false, message: 'Player profile not found' });
      return;
    }

    const documents = await prisma.document.findMany({
      where: {
        ownerType: 'PLAYER',
        ownerId: player.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { documents },
    });
  } catch (error: any) {
    console.error('Get player documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to get documents', error: error.message });
  }
}

/**
 * Get player eligibility status
 */
export async function getEligibilityStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const player = await prisma.player.findUnique({
      where: { userId: req.userId },
      select: {
        id: true,
        playerId: true,
        footballStatus: true,
      },
    });

    if (!player) {
      res.status(404).json({ success: false, message: 'Player profile not found' });
      return;
    }

    // Calculate eligibility (simplified for Phase 1)
    const documents = await prisma.document.findMany({
      where: {
        ownerType: 'PLAYER',
        ownerId: player.id,
      },
      select: {
        documentType: true,
        verificationStatus: true,
        verifiedAt: true,
      },
    });

    const eligibility = {
      playerId: player.playerId,
      footballStatus: player.footballStatus,
      documents: documents.map((doc) => ({
        type: doc.documentType,
        status: doc.verificationStatus,
        verifiedAt: doc.verifiedAt,
      })),
    };

    res.json({
      success: true,
      data: { eligibility },
    });
  } catch (error: any) {
    console.error('Get eligibility status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get eligibility', error: error.message });
  }
}
