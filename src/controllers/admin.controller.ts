import { Request, Response } from 'express';
import prisma from '../config/database';
import { generatePlayerId, generateTeamId } from '../utils/helpers';
import { notifyApplicationStatus, notifyDocumentVerification } from '../services/notification.service';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Admin: Get user profile dashboard
 */
export async function getUserDashboard(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        application: {
          include: {
            trial: {
              include: {
                assignedCoach: {
                  include: {
                    user: {
                      select: {
                        phone: true,
                      },
                    },
                  },
                },
              },
            },
            reviewedByUser: {
              select: {
                phone: true,
              },
            },
          },
        },
        player: {
          select: {
            id: true,
            playerId: true,
            displayName: true,
            footballStatus: true,
            createdAt: true,
          },
        },
        coach: {
          select: {
            id: true,
            coachId: true,
            displayName: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const [applicationDocuments, playerDocuments, coachDocuments] = await Promise.all([
      user.application
        ? prisma.document.findMany({
            where: { ownerType: 'PLAYER_APPLICATION', ownerId: user.application.id },
          })
        : Promise.resolve([]),
      user.player
        ? prisma.document.findMany({
            where: { ownerType: 'PLAYER', ownerId: user.player.id },
          })
        : Promise.resolve([]),
      user.coach
        ? prisma.document.findMany({
            where: { ownerType: 'COACH', ownerId: user.coach.id },
          })
        : Promise.resolve([]),
    ]);

    const enrichedUser = {
      ...user,
      application: user.application
        ? { ...user.application, documents: applicationDocuments }
        : null,
      player: user.player ? { ...user.player, documents: playerDocuments } : null,
      coach: user.coach ? { ...user.coach, documents: coachDocuments } : null,
      documents: [...applicationDocuments, ...playerDocuments, ...coachDocuments],
    };

    res.json({
      success: true,
      data: { user: enrichedUser },
    });
  } catch (error: any) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user dashboard', error: error.message });
  }
}

/**
 * Admin: Get all users (with filters)
 */
export async function getAllUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { role, status, search } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { phone: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          phone: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          application: {
            select: {
              status: true,
              submittedAt: true,
            },
          },
          player: {
            select: {
              playerId: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Failed to get users', error: error.message });
  }
}

/**
 * Admin: Get all applications (with optional status filter)
 */
export async function getAllApplications(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { status } = req.query;
    const where: any = {};
    
    // If status is provided, filter by it; otherwise get all non-draft applications
    if (status) {
      if (Array.isArray(status)) {
        where.status = { in: status as string[] };
      } else {
        where.status = status as string;
      }
    } else {
      // Default: exclude DRAFT applications
      where.status = { not: 'DRAFT' };
    }

    const applications = await prisma.playerApplication.findMany({
      where,
      include: {
        user: {
          select: {
            phone: true,
            email: true,
            createdAt: true,
          },
        },
        trial: {
          include: {
            assignedCoach: {
              include: {
                user: {
                  select: {
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const applicationIds = applications.map((app) => app.id);
    const documents = await prisma.document.findMany({
      where: {
        ownerType: 'PLAYER_APPLICATION',
        ownerId: { in: applicationIds },
      },
      select: {
        ownerId: true,
        documentType: true,
        verificationStatus: true,
      },
    });

    const documentsByApplicationId = documents.reduce<Record<string, typeof documents>>((acc, doc) => {
      if (!acc[doc.ownerId]) {
        acc[doc.ownerId] = [];
      }
      acc[doc.ownerId].push(doc);
      return acc;
    }, {});

    // Add risk indicators
    const applicationsWithRisks = applications.map((app) => {
      const appDocuments = documentsByApplicationId[app.id] || [];
      const risks: string[] = [];
      
      // Check age mismatch
      const dobDoc = appDocuments.find((doc) => doc.documentType === 'DOB_PROOF');
      if (dobDoc && dobDoc.verificationStatus !== 'VERIFIED') {
        risks.push('DOB_PROOF_NOT_VERIFIED');
      }

      // Check missing emergency contact
      if (!app.emergencyContactName || !app.emergencyContactPhone) {
        risks.push('MISSING_EMERGENCY_CONTACT');
      }

      // Check trial status
      if (app.trialStatus !== 'COMPLETED' || !app.trial || app.trial.outcome !== 'RECOMMENDED') {
        risks.push('TRIAL_NOT_RECOMMENDED');
      }

      // Check documents
      const pendingDocs = appDocuments.filter((doc) => doc.verificationStatus === 'PENDING');
      if (pendingDocs.length > 0) {
        risks.push('PENDING_DOCUMENTS');
      }

      return {
        ...app,
        documents: appDocuments,
        riskIndicators: risks,
      };
    });

    res.json({
      success: true,
      data: { applications: applicationsWithRisks },
    });
  } catch (error: any) {
    console.error('Get all applications error:', error);
    res.status(500).json({ success: false, message: 'Failed to get applications', error: error.message });
  }
}

/**
 * Admin: Get pending approvals (for backward compatibility)
 */
export async function getPendingApprovals(req: AuthRequest, res: Response): Promise<void> {
  // Redirect to getAllApplications with status filter
  req.query.status = ['SUBMITTED', 'UNDER_REVIEW', 'HOLD'];
  return getAllApplications(req, res);
}

/**
 * Admin: Approve player application
 */
export async function approveApplication(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { applicationId } = req.params;

    const application = await prisma.playerApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: true,
        trial: true,
      },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    if (application.status === 'APPROVED') {
      res.status(400).json({ success: false, message: 'Application already approved' });
      return;
    }

    const applicationDocuments = await prisma.document.findMany({
      where: {
        ownerType: 'PLAYER_APPLICATION',
        ownerId: application.id,
      },
      select: {
        verificationStatus: true,
      },
    });

    // Check prerequisites
    const allDocsVerified = applicationDocuments.every((doc) => doc.verificationStatus === 'VERIFIED');
    if (!allDocsVerified) {
      res.status(400).json({ success: false, message: 'All documents must be verified before approval' });
      return;
    }

    if (!application.trial || application.trial.outcome !== 'RECOMMENDED') {
      res.status(400).json({ success: false, message: 'Trial must be completed with RECOMMENDED outcome' });
      return;
    }

    // Approve and create player
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update application status
      await tx.playerApplication.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVED',
          reviewedBy: req.userId,
          reviewedAt: new Date(),
        },
      });

      // 2. Create player
      const playerId = generatePlayerId();
      const player = await tx.player.create({
        data: {
          playerId,
          userId: application.userId,
          dateOfBirth: application.dateOfBirth,
          gender: application.gender,
          primaryPosition: application.primaryPosition,
          dominantFoot: application.dominantFoot,
          city: application.city,
          state: application.state,
          district: application.district,
          emergencyContactName: application.emergencyContactName,
          emergencyContactPhone: application.emergencyContactPhone,
          emergencyContactRelation: application.emergencyContactRelation,
          footballStatus: 'ACTIVE',
        },
      });

      // 3. Update user role
      await tx.user.update({
        where: { id: application.userId },
        data: { role: 'PLAYER' },
      });

      return player;
    });

    // Notify user
    await notifyApplicationStatus(application.userId, 'APPROVED');

    res.json({
      success: true,
      message: 'Application approved. Player created successfully.',
      data: { playerId: result.playerId },
    });
  } catch (error: any) {
    console.error('Approve application error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve application', error: error.message });
  }
}

/**
 * Admin: Reject application
 */
export async function rejectApplication(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { applicationId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ success: false, message: 'Rejection reason is required' });
      return;
    }

    const application = await prisma.playerApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    if (application.status === 'APPROVED') {
      res.status(400).json({ success: false, message: 'Cannot reject an approved application' });
      return;
    }

    // Update application
    await prisma.playerApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        reviewedBy: req.userId,
        reviewedAt: new Date(),
        rejectionReason: reason,
        resubmissionAttempts: { increment: 1 },
        lastResubmissionAt: new Date(),
      },
    });

    // Notify user
    await notifyApplicationStatus(application.userId, 'REJECTED', reason);

    res.json({
      success: true,
      message: 'Application rejected',
    });
  } catch (error: any) {
    console.error('Reject application error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject application', error: error.message });
  }
}

/**
 * Admin: Hold application
 */
export async function holdApplication(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { applicationId } = req.params;
    const { reason } = req.body;

    const application = await prisma.playerApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    await prisma.playerApplication.update({
      where: { id: applicationId },
      data: {
        status: 'HOLD',
        reviewedBy: req.userId,
        reviewedAt: new Date(),
        rejectionReason: reason || 'Application on hold pending further review',
      },
    });

    await notifyApplicationStatus(application.userId, 'HOLD', reason);

    res.json({
      success: true,
      message: 'Application put on hold',
    });
  } catch (error: any) {
    console.error('Hold application error:', error);
    res.status(500).json({ success: false, message: 'Failed to hold application', error: error.message });
  }
}

/**
 * Admin: Verify document
 */
export async function verifyDocument(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { documentId } = req.params;
    const { status, reason } = req.body;

    if (!status || !['VERIFIED', 'REJECTED'].includes(status)) {
      res.status(400).json({ success: false, message: 'Status must be VERIFIED or REJECTED' });
      return;
    }

    if (status === 'REJECTED' && !reason) {
      res.status(400).json({ success: false, message: 'Rejection reason is required' });
      return;
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    // Update document
    const updatedDoc = await prisma.document.update({
      where: { id: documentId },
      data: {
        verificationStatus: status,
        verifiedBy: req.userId,
        verifiedAt: new Date(),
        rejectionReason: status === 'REJECTED' ? reason : null,
      },
      include: {
        verifiedByUser: {
          select: {
            phone: true,
          },
        },
      },
    });

    // Notify user if we can find them
    if (document.ownerType === 'PLAYER_APPLICATION') {
      const application = await prisma.playerApplication.findUnique({
        where: { id: document.ownerId },
        select: { userId: true },
      });
      
      if (application) {
        await notifyDocumentVerification(application.userId, document.documentType, status, reason);
      }
    }

    res.json({
      success: true,
      message: `Document ${status.toLowerCase()} successfully`,
      data: { document: updatedDoc },
    });
  } catch (error: any) {
    console.error('Verify document error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify document', error: error.message });
  }
}

/**
 * Admin: Get pending documents
 */
export async function getPendingDocuments(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const documents = await prisma.document.findMany({
      where: { verificationStatus: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: { documents },
    });
  } catch (error: any) {
    console.error('Get pending documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to get pending documents', error: error.message });
  }
}

/**
 * Admin: Get team creation requests (default: pending)
 */
export async function getTeamRequests(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { status } = req.query;
    const where: any = {};
    if (status) {
      where.status = status;
    } else {
      where.status = 'PENDING';
    }

    const requests = await prisma.teamCreationRequest.findMany({
      where,
      include: {
        coach: {
          include: {
            user: {
              select: {
                phone: true,
                email: true,
              },
            },
          },
        },
        team: true,
        requestedByUser: {
          select: {
            phone: true,
          },
        },
        reviewedByUser: {
          select: {
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { requests },
    });
  } catch (error: any) {
    console.error('Get team requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to get team requests', error: error.message });
  }
}

/**
 * Admin: Approve team creation request
 */
export async function approveTeamRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { requestId } = req.params;

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.teamCreationRequest.findUnique({
        where: { id: requestId },
        include: {
          coach: true,
        },
      });

      if (!request) {
        throw new Error('REQUEST_NOT_FOUND');
      }

      if (request.status !== 'PENDING') {
        throw new Error('REQUEST_ALREADY_REVIEWED');
      }

      const coach = await tx.coach.findUnique({
        where: { id: request.coachId },
      });

      if (!coach || coach.status !== 'ACTIVE') {
        throw new Error('COACH_NOT_ACTIVE');
      }

      const teamId = generateTeamId();

      const team = await tx.team.create({
        data: {
          teamId,
          name: request.name,
          location: request.location,
          status: 'ACTIVE',
        },
      });

      const assignment = await tx.teamCoach.create({
        data: {
          teamId: team.id,
          coachId: coach.id,
          role: 'HEAD',
        },
      });

      await tx.teamCreationRequest.update({
        where: { id: request.id },
        data: {
          status: 'APPROVED',
          teamDbId: team.id,
          reviewedBy: req.userId,
          reviewedAt: new Date(),
        },
      });

      return { request, team, assignment };
    });

    res.json({
      success: true,
      message: 'Team request approved and team created',
      data: {
        team: result.team,
      },
    });
  } catch (error: any) {
    console.error('Approve team request error:', error);
    let message = 'Failed to approve team request';
    if (error.message === 'REQUEST_NOT_FOUND') message = 'Team request not found';
    if (error.message === 'REQUEST_ALREADY_REVIEWED') message = 'Team request already reviewed';
    if (error.message === 'COACH_NOT_ACTIVE') message = 'Coach must be active to approve team';
    res.status(500).json({ success: false, message, error: error.message });
  }
}

/**
 * Admin: Reject team creation request
 */
export async function rejectTeamRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await prisma.teamCreationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      res.status(404).json({ success: false, message: 'Team request not found' });
      return;
    }

    if (request.status !== 'PENDING') {
      res.status(400).json({ success: false, message: 'Team request already reviewed' });
      return;
    }

    const updated = await prisma.teamCreationRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason || null,
        reviewedBy: req.userId,
        reviewedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Team request rejected',
      data: { request: updated },
    });
  } catch (error: any) {
    console.error('Reject team request error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject team request', error: error.message });
  }
}

/**
 * Admin: Get all players (with optional search + pagination)
 */
export async function getAllPlayers(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { search, footballStatus } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (footballStatus) where.footballStatus = footballStatus;

    const q = typeof search === 'string' ? search.trim() : '';
    if (q) {
      where.OR = [
        { playerId: { contains: q, mode: 'insensitive' } },
        { displayName: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { state: { contains: q, mode: 'insensitive' } },
        { district: { contains: q, mode: 'insensitive' } },
        { user: { phone: { contains: q } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        select: {
          id: true,
          playerId: true,
          displayName: true,
          footballStatus: true,
          primaryPosition: true,
          dominantFoot: true,
          gender: true,
          dateOfBirth: true,
          city: true,
          state: true,
          district: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              phone: true,
              email: true,
              role: true,
              status: true,
              createdAt: true,
              lastLoginAt: true,
              application: {
                select: {
                  id: true,
                  status: true,
                  submittedAt: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.player.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        players,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get all players error:', error);
    res.status(500).json({ success: false, message: 'Failed to get players', error: error.message });
  }
}

/**
 * Admin: Get individual player profile (by DB id or public playerId)
 */
export async function getPlayerProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { playerId } = req.params;

    const player = await prisma.player.findFirst({
      where: {
        OR: [{ id: playerId }, { playerId }],
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
      },
    });

    if (!player) {
      res.status(404).json({ success: false, message: 'Player not found' });
      return;
    }

    const application = await prisma.playerApplication.findUnique({
      where: { userId: player.userId },
      include: {
        trial: {
          include: {
            assignedCoach: {
              include: {
                user: {
                  select: { phone: true },
                },
              },
            },
          },
        },
        reviewedByUser: {
          select: { phone: true },
        },
      },
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

    res.json({
      success: true,
      data: {
        player: {
          ...player,
          documents: playerDocuments,
        },
        application: application ? { ...application, documents: applicationDocuments } : null,
        documents: [...playerDocuments, ...applicationDocuments],
      },
    });
  } catch (error: any) {
    console.error('Get player profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get player profile', error: error.message });
  }
}
