import { Request, Response } from 'express';
import prisma from '../config/database';
import { generatePlayerId, generateTeamId, generateCoachId, formatPhone, isValidPhone, isValidMPIN } from '../utils/helpers';
import { hashMPIN, setMPIN } from '../services/mpin.service';
import { notifyApplicationStatus, notifyDocumentVerification } from '../services/notification.service';
import { getPresignedUrl } from '../services/storage.service';
import { AuthRequest } from '../middleware/auth.middleware';

/** Application statuses that count as pending/review for dashboard and approvals */
const PENDING_REVIEW_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'HOLD'] as const;

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
              fullName: true,
            },
          },
          player: {
            select: {
              playerId: true,
              photo: true,
              displayName: true,
            },
          },
          coach: {
            select: {
              coachId: true,
              photo: true,
              displayName: true,
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
 * Admin: Update user (phone, email, status, MPIN, and optionally name/photo on Player or Coach).
 */
export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { userId } = req.params;
    const { phone, email, status, mpin, name, photo } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { player: true, coach: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const userData: { phone?: string; email?: string | null; status?: string } = {};
    if (phone !== undefined && typeof phone === 'string') userData.phone = phone.trim();
    if (email !== undefined) userData.email = email === '' || email === null ? null : String(email);
    if (status !== undefined && typeof status === 'string') userData.status = status;

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userData,
      });
    }

    if (mpin !== undefined && mpin !== null && String(mpin).trim() !== '') {
      const mpinStr = String(mpin).trim();
      if (!isValidMPIN(mpinStr)) {
        res.status(400).json({ success: false, message: 'MPIN must be 4-6 digits' });
        return;
      }
      await setMPIN(userId, mpinStr);
    }

    if (user.player && (name !== undefined || photo !== undefined)) {
      const playerData: { displayName?: string | null; photo?: string | null } = {};
      if (name !== undefined) playerData.displayName = typeof name === 'string' ? name.trim() || null : null;
      if (photo !== undefined) playerData.photo = photo === '' || photo === null ? null : String(photo);
      if (Object.keys(playerData).length > 0) {
        await prisma.player.update({
          where: { userId },
          data: playerData,
        });
      }
    }

    if (user.coach && (name !== undefined || photo !== undefined)) {
      const coachData: { displayName?: string | null; photo?: string | null } = {};
      if (name !== undefined) coachData.displayName = typeof name === 'string' ? name.trim() || null : null;
      if (photo !== undefined) coachData.photo = photo === '' || photo === null ? null : String(photo);
      if (Object.keys(coachData).length > 0) {
        await prisma.coach.update({
          where: { userId },
          data: coachData,
        });
      }
    }

    res.json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
}

/**
 * Admin: Create coach account (direct creation, no invite).
 * Creates User with role COACH, status ACTIVE, and Coach profile. Coach appears in User Management.
 */
export async function createCoach(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { fullName, phone, mpin } = req.body;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      res.status(400).json({ success: false, message: 'Full name is required' });
      return;
    }

    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number is required' });
      return;
    }

    if (!mpin) {
      res.status(400).json({ success: false, message: 'MPIN is required' });
      return;
    }

    const formattedPhone = formatPhone(phone);
    if (!isValidPhone(formattedPhone)) {
      res.status(400).json({ success: false, message: 'Invalid phone number format' });
      return;
    }

    if (!/^\d{4,6}$/.test(String(mpin))) {
      res.status(400).json({ success: false, message: 'MPIN must be 4–6 digits' });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });
    if (existing) {
      res.status(400).json({ success: false, message: 'A user with this phone number already exists' });
      return;
    }

    const mpinHash = await hashMPIN(String(mpin));
    const coachId = generateCoachId();

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: formattedPhone,
          role: 'COACH',
          status: 'ACTIVE',
          mpinHash,
        },
      });

      const coach = await tx.coach.create({
        data: {
          coachId,
          userId: user.id,
          sport: 'FOOTBALL',
          ageGroups: '[]',
          coachingRole: 'ASSISTANT',
          status: 'ACTIVE',
          displayName: fullName.trim(),
        },
      });

      return { user, coach };
    });

    res.status(201).json({
      success: true,
      message: 'Coach account created successfully. They appear in User Management.',
      data: {
        userId: result.user.id,
        coachId: result.coach.coachId,
        phone: result.user.phone,
        fullName: result.coach.displayName,
      },
    });
  } catch (error: any) {
    console.error('Create coach error:', error);
    res.status(500).json({ success: false, message: 'Failed to create coach', error: error.message });
  }
}

/**
 * Admin: Create referee user (direct creation).
 * Creates User with role REFEREE and ACTIVE status. Referee appears in Referee Management.
 */
export async function createReferee(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { phone, name, mpin } = req.body as {
      phone?: string;
      name?: string;
      mpin?: string | number;
    };

    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number is required' });
      return;
    }

    if (!mpin && mpin !== 0) {
      res.status(400).json({ success: false, message: 'mPIN is required' });
      return;
    }

    const formattedPhone = formatPhone(phone);
    if (!isValidPhone(formattedPhone)) {
      res.status(400).json({ success: false, message: 'Invalid phone number format' });
      return;
    }

    const mpinStr = String(mpin);
    if (!/^\d{4}$/.test(mpinStr)) {
      res.status(400).json({ success: false, message: 'mPIN must be a 4-digit number' });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });
    if (existing) {
      res.status(400).json({ success: false, message: 'A user with this phone number already exists' });
      return;
    }

    const mpinHash = await hashMPIN(mpinStr);

    const user = await prisma.user.create({
      data: {
        phone: formattedPhone,
        role: 'REFEREE',
        status: 'ACTIVE',
        mpinHash,
        displayName: typeof name === 'string' && name.trim() ? name.trim() : null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Referee created successfully',
      data: {
        userId: user.id,
        phone: user.phone,
        name: user.displayName,
        status: user.status,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Create referee error:', error);
    res.status(500).json({ success: false, message: 'Failed to create referee', error: error.message });
  }
}

/**
 * Admin: Get all referees
 */
export async function getAllReferees(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { search, status } = req.query as { search?: string; status?: string };

    const where: any = {
      role: 'REFEREE',
    };

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      where.OR = [
        { phone: { contains: term, mode: 'insensitive' } },
        { displayName: { contains: term, mode: 'insensitive' } },
      ];
    }

    const referees = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        phone: true,
        displayName: true,
        status: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: { referees },
    });
  } catch (error: any) {
    console.error('Get referees error:', error);
    res.status(500).json({ success: false, message: 'Failed to get referees', error: error.message });
  }
}

/**
 * Admin: Update referee (name / status)
 */
export async function updateReferee(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { userId } = req.params;
    const { name, status } = req.body as { name?: string; status?: string };

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'REFEREE') {
      res.status(404).json({ success: false, message: 'Referee not found' });
      return;
    }

    const data: any = {};
    if (typeof name === 'string') {
      data.displayName = name.trim() || null;
    }
    if (typeof status === 'string' && status.trim()) {
      data.status = status.trim();
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({ success: false, message: 'No valid fields to update' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data,
    });

    res.json({
      success: true,
      message: 'Referee updated successfully',
    });
  } catch (error: any) {
    console.error('Update referee error:', error);
    res.status(500).json({ success: false, message: 'Failed to update referee', error: error.message });
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
        id: true,
        ownerId: true,
        documentType: true,
        verificationStatus: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        notes: true,
      },
    });

    const documentsByApplicationId = documents.reduce<Record<string, typeof documents>>((acc, doc) => {
      if (!acc[doc.ownerId]) {
        acc[doc.ownerId] = [];
      }
      acc[doc.ownerId].push(doc);
      return acc;
    }, {});

    // Resolve preferred team IDs to names so frontend can show team names instead of IDs
    const allPreferredIds = new Set<string>();
    applications.forEach((app) => {
      const raw = app.preferredTeamIds;
      if (!raw || typeof raw !== 'string') return;
      try {
        const ids = JSON.parse(raw) as string[];
        if (Array.isArray(ids)) {
          ids.forEach((id) => allPreferredIds.add(id));
        }
      } catch {
        // ignore malformed JSON
      }
    });

    let teamIdToName: Record<string, string> = {};
    if (allPreferredIds.size > 0) {
      const teams = await prisma.team.findMany({
        where: {
          OR: [
            { id: { in: Array.from(allPreferredIds) } },
            { teamId: { in: Array.from(allPreferredIds) } },
          ],
        },
        select: {
          id: true,
          teamId: true,
          name: true,
        },
      });

      teams.forEach((team) => {
        teamIdToName[team.id] = team.name;
        teamIdToName[team.teamId] = team.name;
      });
    }

    // Add risk indicators, preferredTeamNames and consolidated evaluation snapshot
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

      // Map preferred team IDs to human-readable names
      let preferredTeamNames: string[] = [];
      const rawPreferred = app.preferredTeamIds;
      if (rawPreferred && typeof rawPreferred === 'string') {
        try {
          const ids = JSON.parse(rawPreferred) as string[];
          if (Array.isArray(ids)) {
            preferredTeamNames = ids
              .map((id) => teamIdToName[id] || null)
              .filter((name): name is string => Boolean(name));
          }
        } catch {
          // ignore malformed JSON
        }
      }

      // Build consolidated evaluation snapshot for admin
      const trial: any = app.trial || null;

      // Medical checklist (parsed JSON, if any)
      let medicalChecklist: unknown = null;
      if (trial && trial.medicalChecklistJson) {
        try {
          medicalChecklist = JSON.parse(trial.medicalChecklistJson as string);
        } catch {
          medicalChecklist = trial.medicalChecklistJson;
        }
      }

      // Medical report document (if linked)
      const medicalReport =
        (trial?.medicalReportDocumentId &&
          appDocuments.find((d) => d.id === trial.medicalReportDocumentId)) ||
        appDocuments.find((d) => d.documentType === 'MEDICAL_REPORT_FOOTBALL') ||
        null;

      // Emergency contacts (parsed JSON snapshot, if available)
      let emergencyContacts: unknown = null;
      if (app.emergencyContactsJson) {
        try {
          emergencyContacts = JSON.parse(app.emergencyContactsJson as string);
        } catch {
          emergencyContacts = app.emergencyContactsJson;
        }
      }

      const evaluationSnapshot = {
        playerSnapshot: {
          fullName: app.fullName,
          dateOfBirth: app.dateOfBirth,
          gender: app.gender,
          height: app.height,
          weight: app.weight,
          nationality: app.nationality,
        },
        playingProfile: {
          sport: app.sport,
          primaryPosition: app.primaryPosition,
          dominantFoot: app.dominantFoot,
        },
        locationAndPreferences: {
          city: app.city,
          district: app.district,
          state: app.state,
          pincode: app.pincode,
          preferredTeamIds: app.preferredTeamIds,
          preferredTeamNames,
        },
        contactInformation: {
          playerPhone: app.playerPhone,
          playerEmail: (app as any).playerEmail,
          emergencyContactName: app.emergencyContactName,
          emergencyContactPhone: app.emergencyContactPhone,
          emergencyContactRelation: app.emergencyContactRelation,
          emergencyContacts,
        },
        documents: appDocuments,
        medicalCheck: {
          verified: trial?.medicalVerified ?? null,
          checklist: medicalChecklist,
          medicalReport,
        },
        trialEvaluation: {
          status: trial?.status ?? null,
          outcome: trial?.outcome ?? null,
          notes: trial?.notes ?? null,
          evaluatedAt: trial?.evaluatedAt ?? null,
          assignedCoach: trial?.assignedCoach
            ? {
                id: trial.assignedCoach.id,
                coachId: trial.assignedCoach.coachId,
                displayName: trial.assignedCoach.displayName,
                phone: trial.assignedCoach.user?.phone,
                email: trial.assignedCoach.user?.email,
              }
            : null,
        },
      };

      return {
        ...app,
        documents: appDocuments,
        riskIndicators: risks,
        preferredTeamNames,
        evaluationSnapshot,
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
  req.query.status = [...PENDING_REVIEW_STATUSES];
  return getAllApplications(req, res);
}

/**
 * Admin: Get dashboard stats (counts + recent applications) for admin dashboard
 */
export async function getDashboardStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const [totalPlayers, pendingApplications, coachesCount, recentRows] = await Promise.all([
      prisma.player.count(),
      prisma.playerApplication.count({ where: { status: { in: [...PENDING_REVIEW_STATUSES] } } }),
      prisma.coach.count(),
      prisma.playerApplication.findMany({
        where: { status: { not: 'DRAFT' } },
        orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
        take: 10,
        select: {
          id: true,
          fullName: true,
          preferredTeamIds: true,
          status: true,
          submittedAt: true,
          createdAt: true,
          user: {
            select: {
              player: { select: { photo: true } },
            },
          },
        },
      }),
    ]);

    const allPreferredIds = new Set<string>();
    recentRows.forEach((app) => {
      const raw = app.preferredTeamIds;
      if (!raw || typeof raw !== 'string') return;
      try {
        const ids = JSON.parse(raw) as string[];
        if (Array.isArray(ids)) ids.forEach((id) => allPreferredIds.add(id));
      } catch {
        // ignore
      }
    });

    let teamIdToName: Record<string, string> = {};
    if (allPreferredIds.size > 0) {
      const teams = await prisma.team.findMany({
        where: {
          OR: [
            { id: { in: Array.from(allPreferredIds) } },
            { teamId: { in: Array.from(allPreferredIds) } },
          ],
        },
        select: { id: true, teamId: true, name: true },
      });
      teams.forEach((t) => {
        teamIdToName[t.id] = t.name;
        teamIdToName[t.teamId] = t.name;
      });
    }

    const applicationIds = recentRows.map((r) => r.id);
    const photoDocs = applicationIds.length > 0
      ? await prisma.document.findMany({
          where: {
            ownerType: 'PLAYER_APPLICATION',
            ownerId: { in: applicationIds },
            documentType: { in: ['PHOTO', 'ID_PROOF', 'ID_CARD'] },
          },
          select: { ownerId: true, documentType: true, fileUrl: true },
        })
      : [];
    const photoMap = new Map<string, string>();
    for (const appId of applicationIds) {
      const docs = photoDocs.filter((d) => d.ownerId === appId);
      const preferred = docs.find((d) => d.documentType === 'PHOTO') || docs.find((d) => d.documentType === 'ID_PROOF') || docs.find((d) => d.documentType === 'ID_CARD');
      if (preferred?.fileUrl) photoMap.set(appId, preferred.fileUrl);
    }

    const recentApplications = recentRows.map((app) => {
      let preferredTeamNames: string[] = [];
      const raw = app.preferredTeamIds;
      if (raw && typeof raw === 'string') {
        try {
          const ids = JSON.parse(raw) as string[];
          if (Array.isArray(ids)) {
            preferredTeamNames = ids
              .map((id) => teamIdToName[id] || null)
              .filter((name): name is string => Boolean(name));
          }
        } catch {
          // ignore
        }
      }
      return {
        id: app.id,
        fullName: app.fullName,
        preferredTeamNames,
        status: app.status,
        submittedAt: app.submittedAt,
        createdAt: app.createdAt,
        photoUrl: (app as any).user?.player?.photo ?? photoMap.get(app.id) ?? null,
      };
    });

    res.json({
      success: true,
      data: {
        totalPlayers,
        pendingApplications,
        coachesCount,
        recentApplications,
      },
    });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get dashboard stats', error: error.message });
  }
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
          nationality: application.nationality,
          displayName: application.fullName,
          emergencyContactName: application.emergencyContactName,
          emergencyContactPhone: application.emergencyContactPhone,
          emergencyContactRelation: application.emergencyContactRelation,
          footballStatus: 'ACTIVE',
        },
      });

      // 2b. Copy profile photo from application document (prefer PHOTO, then ID_PROOF, then ID_CARD)
      const photoDocs = await tx.document.findMany({
        where: {
          ownerType: 'PLAYER_APPLICATION',
          ownerId: application.id,
          documentType: { in: ['PHOTO', 'ID_PROOF', 'ID_CARD'] },
        },
        select: { documentType: true, fileUrl: true },
      });
      const photoDoc = photoDocs.find((d) => d.documentType === 'PHOTO') || photoDocs.find((d) => d.documentType === 'ID_PROOF') || photoDocs.find((d) => d.documentType === 'ID_CARD');
      if (photoDoc?.fileUrl) {
        await tx.player.update({
          where: { id: player.id },
          data: { photo: photoDoc.fileUrl },
        });
      }

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

    const [playersRaw, total] = await Promise.all([
      prisma.player.findMany({
        where,
        select: {
          id: true,
          playerId: true,
          displayName: true,
          photo: true,
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
                  fullName: true,
                  preferredTeamIds: true,
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

    const applicationIds = [...new Set((playersRaw as any[]).map((p: any) => p.user?.application?.id).filter(Boolean))] as string[];
    let applicationPhotoMap = new Map<string, string>();
    if (applicationIds.length > 0) {
      const photoDocs = await prisma.document.findMany({
        where: {
          ownerType: 'PLAYER_APPLICATION',
          ownerId: { in: applicationIds },
          documentType: { in: ['PHOTO', 'ID_PROOF', 'ID_CARD'] },
        },
        select: { ownerId: true, documentType: true, fileUrl: true },
      });
      for (const appId of applicationIds) {
        const docs = photoDocs.filter((d) => d.ownerId === appId);
        const preferred = docs.find((d) => d.documentType === 'PHOTO') || docs.find((d) => d.documentType === 'ID_PROOF') || docs.find((d) => d.documentType === 'ID_CARD');
        if (preferred?.fileUrl) applicationPhotoMap.set(appId, preferred.fileUrl);
      }
    }

    const teamIds = new Set<string>();
    for (const p of playersRaw) {
      const raw = (p as any).user?.application?.preferredTeamIds;
      if (typeof raw === 'string') {
        try {
          const arr = JSON.parse(raw) as string[];
          if (Array.isArray(arr)) arr.forEach((id) => teamIds.add(id));
        } catch {
          // ignore
        }
      }
    }
    const teamMap = new Map<string, string>();
    if (teamIds.size > 0) {
      const teams = await prisma.team.findMany({
        where: { OR: [{ id: { in: [...teamIds] } }, { teamId: { in: [...teamIds] } }] },
        select: { id: true, teamId: true, name: true },
      });
      for (const t of teams) {
        teamMap.set(t.id, t.name);
        teamMap.set(t.teamId, t.name);
      }
    }
    const players = playersRaw.map((p: any) => {
      const app = p.user?.application;
      let assignedTeamNames: string[] = [];
      if (app?.preferredTeamIds) {
        try {
          const ids = JSON.parse(app.preferredTeamIds) as string[];
          if (Array.isArray(ids))
            assignedTeamNames = ids.map((id) => teamMap.get(id) || id).filter(Boolean);
        } catch {
          // ignore
        }
      }
      const photo = p.photo || (app?.id ? applicationPhotoMap.get(app.id) : null) || null;
      return { ...p, assignedTeamNames, photo };
    });

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

    const signedPlayerDocuments = await Promise.all(
      playerDocuments.map(async (doc) => ({
        ...doc,
        fileUrl: await getPresignedUrl(doc.fileUrl),
      })),
    );

    const signedApplicationDocuments = await Promise.all(
      applicationDocuments.map(async (doc) => ({
        ...doc,
        fileUrl: await getPresignedUrl(doc.fileUrl),
      })),
    );

    const documents = [...signedPlayerDocuments, ...signedApplicationDocuments];
    const playerPhotoUrl = player.photo ? await getPresignedUrl(player.photo) : null;

    res.json({
      success: true,
      data: {
        player: {
          ...player,
          photo: playerPhotoUrl,
          documents: signedPlayerDocuments,
        },
        application: application ? { ...application, documents: signedApplicationDocuments } : null,
        documents,
      },
    });
  } catch (error: any) {
    console.error('Get player profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get player profile', error: error.message });
  }
}

/**
 * Admin: One-time sync – copy profile photo from application document to player.photo for players who don't have one
 */
export async function syncPlayerPhotos(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const playersWithoutPhoto = await prisma.player.findMany({
      where: { OR: [{ photo: null }, { photo: '' }] },
      select: { id: true, userId: true },
    });

    let updated = 0;
    for (const player of playersWithoutPhoto) {
      const application = await prisma.playerApplication.findUnique({
        where: { userId: player.userId },
        select: { id: true },
      });
      if (!application) continue;

      const photoDocs = await prisma.document.findMany({
        where: {
          ownerType: 'PLAYER_APPLICATION',
          ownerId: application.id,
          documentType: { in: ['PHOTO', 'ID_PROOF', 'ID_CARD'] },
        },
        select: { documentType: true, fileUrl: true },
      });
      const photoDoc = photoDocs.find((d) => d.documentType === 'PHOTO') || photoDocs.find((d) => d.documentType === 'ID_PROOF') || photoDocs.find((d) => d.documentType === 'ID_CARD');
      if (photoDoc?.fileUrl) {
        await prisma.player.update({
          where: { id: player.id },
          data: { photo: photoDoc.fileUrl },
        });
        updated++;
      }
    }

    res.json({
      success: true,
      message: `Synced profile photos. Updated ${updated} of ${playersWithoutPhoto.length} players without photo.`,
      data: { updated, total: playersWithoutPhoto.length },
    });
  } catch (error: any) {
    console.error('Sync player photos error:', error);
    res.status(500).json({ success: false, message: 'Failed to sync player photos', error: error.message });
  }
}
