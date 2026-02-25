import { Request, Response } from 'express';
import prisma from '../config/database';
import { verifyOTP, clearOTP } from '../services/otp.service';
import { setMPIN } from '../services/mpin.service';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Public: Get invite by token (legacy; invite links no longer used)
 */
export async function getInviteByToken(req: Request, res: Response): Promise<void> {
  try {
    const { inviteToken } = req.params;

    if (!inviteToken) {
      res.status(400).json({ success: false, message: 'Invite token is required' });
      return;
    }

    const coach = await prisma.coach.findUnique({
      where: { inviteToken },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            mpinHash: true,
            status: true,
          },
        },
      },
    });

    if (!coach) {
      res.status(404).json({ success: false, message: 'Invalid or expired invite link' });
      return;
    }

    // Check if MPIN is already set (invite link expired)
    if (coach.user.mpinHash) {
      res.status(400).json({ 
        success: false, 
        message: 'This invite link has expired. MPIN has already been set. Please use the regular login.',
        inviteExpired: true,
      });
      return;
    }

    // Check if coach status allows invite access
    if (coach.status !== 'INVITED' && coach.status !== 'VERIFIED') {
      res.status(400).json({ 
        success: false, 
        message: 'This invite link is no longer valid.',
        inviteExpired: true,
      });
      return;
    }

    res.json({
      success: true,
      message: 'Invite link is valid',
      data: {
        coachId: coach.coachId,
        phone: coach.user.phone,
        userId: coach.user.id,
        status: coach.status,
      },
    });
  } catch (error: any) {
    console.error('Get invite by token error:', error);
    res.status(500).json({ success: false, message: 'Failed to validate invite', error: error.message });
  }
}

/**
 * Coach: Verify OTP (after receiving invite)
 */
export async function verifyCoachOTP(req: Request, res: Response): Promise<void> {
  try {
    const { userId, otpCode } = req.body;

    if (!userId || !otpCode) {
      res.status(400).json({ success: false, message: 'UserId and OTP code are required' });
      return;
    }

    const isValid = await verifyOTP(userId, otpCode);

    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      return;
    }

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: {
        otpVerified: true,
        status: 'VERIFIED',
      },
    });

    // Update coach status
    await prisma.coach.updateMany({
      where: { userId },
      data: { status: 'VERIFIED' },
    });

    await clearOTP(userId);

    res.json({
      success: true,
      message: 'OTP verified. Please set your MPIN.',
      data: { verified: true },
    });
  } catch (error: any) {
    console.error('Verify coach OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP', error: error.message });
  }
}

/**
 * Coach: Setup MPIN (after OTP verification)
 */
export async function setupCoachMPIN(req: Request, res: Response): Promise<void> {
  try {
    const { userId, mpin } = req.body;

    if (!userId || !mpin) {
      res.status(400).json({ success: false, message: 'UserId and MPIN are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { otpVerified: true, role: true },
    });

    if (!user || user.role !== 'COACH') {
      res.status(404).json({ success: false, message: 'Coach not found' });
      return;
    }

    if (!user.otpVerified) {
      res.status(400).json({ success: false, message: 'Please verify OTP first' });
      return;
    }

    await setMPIN(userId, mpin);

    // Expire invite token after MPIN is set
    const coach = await prisma.coach.findFirst({
      where: { userId },
      select: { id: true },
    });
    if (coach) {
      await prisma.coach.update({
        where: { id: coach.id },
        data: { inviteToken: null }, // Remove invite token to expire the link
      });
    }

    res.json({
      success: true,
      message: 'MPIN set successfully. Waiting for admin activation.',
    });
  } catch (error: any) {
    console.error('Setup coach MPIN error:', error);
    res.status(500).json({ success: false, message: 'Failed to set MPIN', error: error.message });
  }
}

/**
 * Admin: Activate coach
 */
export async function activateCoach(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { coachId } = req.params;

    const coach = await prisma.coach.findUnique({
      where: { coachId },
      include: { user: true },
    });

    if (!coach) {
      res.status(404).json({ success: false, message: 'Coach not found' });
      return;
    }

    if (coach.status !== 'VERIFIED') {
      res.status(400).json({ 
        success: false, 
        message: `Coach status is ${coach.status}. Only VERIFIED coaches can be activated.` 
      });
      return;
    }

    if (!coach.user.mpinHash) {
      res.status(400).json({ success: false, message: 'Coach must set MPIN before activation' });
      return;
    }

    // Activate coach
    await prisma.$transaction(async (tx) => {
      await tx.coach.update({
        where: { id: coach.id },
        data: {
          status: 'ACTIVE',
          activatedBy: req.userId,
          activatedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: coach.userId },
        data: { status: 'ACTIVE' },
      });
    });

    res.json({
      success: true,
      message: 'Coach activated successfully',
      data: { coachId: coach.coachId },
    });
  } catch (error: any) {
    console.error('Activate coach error:', error);
    res.status(500).json({ success: false, message: 'Failed to activate coach', error: error.message });
  }
}

/**
 * Get coach profile
 */
export async function getCoachProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const coach = await prisma.coach.findUnique({
      where: { userId: req.userId },
      include: {
        user: {
          select: {
            phone: true,
            email: true,
            status: true,
          },
        },
        teamAssignments: {
          include: {
            coach: {
              select: {
                coachId: true,
                displayName: true,
              },
            },
          },
        },
        trialEvaluations: {
          select: {
            id: true,
            outcome: true,
            evaluatedAt: true,
          },
          take: 10,
          orderBy: { evaluatedAt: 'desc' },
        },
      },
    });

    if (!coach) {
      res.status(404).json({ success: false, message: 'Coach profile not found' });
      return;
    }

    // Parse JSON fields
    const coachData = {
      ...coach,
      ageGroups: JSON.parse(coach.ageGroups || '[]'),
      specializationTags: coach.specializationTags ? JSON.parse(coach.specializationTags) : null,
    };

    res.json({
      success: true,
      data: { coach: coachData },
    });
  } catch (error: any) {
    console.error('Get coach profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get coach profile', error: error.message });
  }
}

/**
 * Coach: Get my players (players assigned to my team(s))
 */
export async function getMyPlayers(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'COACH') {
      res.status(403).json({ success: false, message: 'Coach access required' });
      return;
    }

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const coach = await prisma.coach.findUnique({
      where: { userId: req.userId },
      select: { id: true, status: true },
    });

    if (!coach) {
      res.status(404).json({ success: false, message: 'Coach profile not found' });
      return;
    }

    // Only active coaches can see their players
    if (coach.status !== 'ACTIVE') {
      res.status(403).json({ success: false, message: 'Only active coaches can view their players' });
      return;
    }

    // Find teams I am actively assigned to
    const assignments = await prisma.teamCoach.findMany({
      where: {
        coachId: coach.id,
        status: 'ACTIVE',
      },
      include: {
        team: {
          select: {
            id: true,
            teamId: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const myTeams = assignments.map((a) => a.team);
    if (myTeams.length === 0) {
      res.json({ success: true, data: { teams: [], players: [] } });
      return;
    }

    const teamKeys = new Set<string>();
    for (const t of myTeams) {
      if (t.teamId) teamKeys.add(t.teamId);
      if (t.id) teamKeys.add(t.id);
    }

    // NOTE:
    // We currently treat a player as "assigned to a team" if their approved application
    // included that team in preferredTeamIds (JSON array string).
    const applications = await prisma.playerApplication.findMany({
      where: {
        status: 'APPROVED',
        preferredTeamIds: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            player: {
              select: {
                id: true,
                playerId: true,
                displayName: true,
                primaryPosition: true,
                footballStatus: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const players = applications
      .filter((app) => Boolean(app.user.player) && Boolean(app.preferredTeamIds))
      .map((app) => {
        let preferred: string[] = [];
        try {
          preferred = JSON.parse(app.preferredTeamIds || '[]');
        } catch {
          preferred = [];
        }

        const matchedTeamKeys = preferred.filter((k) => teamKeys.has(k));
        if (matchedTeamKeys.length === 0) return null;

        const matchedTeams = myTeams
          .filter((t) => matchedTeamKeys.includes(t.teamId) || matchedTeamKeys.includes(t.id))
          .map((t) => ({ teamId: t.teamId, name: t.name, location: t.location || null }));

        const player = app.user.player!;
        return {
          id: player.id,
          playerId: player.playerId,
          displayName: player.displayName,
          primaryPosition: player.primaryPosition,
          footballStatus: player.footballStatus,
          createdAt: player.createdAt,
          matchedTeams,
          user: {
            id: app.user.id,
            phone: app.user.phone,
            email: app.user.email,
          },
          application: {
            id: app.id,
            fullName: app.fullName,
            submittedAt: app.submittedAt,
          },
        };
      })
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    const filteredPlayers = search
      ? players.filter((p) => {
          const hay = [
            p.playerId,
            p.displayName || '',
            p.application?.fullName || '',
            p.user?.phone || '',
            p.user?.email || '',
            ...(p.matchedTeams || []).map((t) => `${t.teamId} ${t.name}`),
          ]
            .join(' ')
            .toLowerCase();
          return hay.includes(search.toLowerCase());
        })
      : players;

    res.json({
      success: true,
      data: {
        teams: myTeams,
        players: filteredPlayers,
      },
    });
  } catch (error: any) {
    console.error('Get my players error:', error);
    res.status(500).json({ success: false, message: 'Failed to get players', error: error.message });
  }
}

/**
 * Coach: Get player profile (only if assigned to my team(s))
 */
export async function getPlayerProfileForCoach(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'COACH') {
      res.status(403).json({ success: false, message: 'Coach access required' });
      return;
    }

    const { playerId } = req.params;

    const coach = await prisma.coach.findUnique({
      where: { userId: req.userId },
      select: { id: true, status: true },
    });

    if (!coach) {
      res.status(404).json({ success: false, message: 'Coach profile not found' });
      return;
    }

    if (coach.status !== 'ACTIVE') {
      res.status(403).json({ success: false, message: 'Only active coaches can view player profiles' });
      return;
    }

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
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!player) {
      res.status(404).json({ success: false, message: 'Player not found' });
      return;
    }

    // Get coach's active teams
    const assignments = await prisma.teamCoach.findMany({
      where: {
        coachId: coach.id,
        status: 'ACTIVE',
      },
      include: {
        team: {
          select: {
            id: true,
            teamId: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const myTeams = assignments.map((a) => a.team);
    if (myTeams.length === 0) {
      res.status(403).json({ success: false, message: 'You have no active teams' });
      return;
    }

    const teamKeys = new Set<string>();
    for (const t of myTeams) {
      if (t.teamId) teamKeys.add(t.teamId);
      if (t.id) teamKeys.add(t.id);
    }

    const application = await prisma.playerApplication.findUnique({
      where: { userId: player.userId },
    });

    if (!application || application.status !== 'APPROVED' || !application.preferredTeamIds) {
      res.status(403).json({ success: false, message: 'You are not assigned to this player' });
      return;
    }

    let preferred: string[] = [];
    try {
      preferred = JSON.parse(application.preferredTeamIds || '[]');
    } catch {
      preferred = [];
    }

    const matchedTeamKeys = preferred.filter((k) => teamKeys.has(k));
    if (matchedTeamKeys.length === 0) {
      res.status(403).json({ success: false, message: 'You are not assigned to this player' });
      return;
    }

    const matchedTeams = myTeams
      .filter((t) => matchedTeamKeys.includes(t.teamId) || matchedTeamKeys.includes(t.id))
      .map((t) => ({ teamId: t.teamId, name: t.name, location: t.location || null }));

    const [playerDocuments, applicationDocuments] = await Promise.all([
      prisma.document.findMany({
        where: { ownerType: 'PLAYER', ownerId: player.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.document.findMany({
        where: { ownerType: 'PLAYER_APPLICATION', ownerId: application.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        player: {
          ...player,
          teams: matchedTeams,
          documents: playerDocuments,
        },
        application: {
          id: application.id,
          fullName: application.fullName,
          submittedAt: application.submittedAt,
          reviewedAt: application.reviewedAt,
          status: application.status,
        },
        documents: [...playerDocuments, ...applicationDocuments],
      },
    });
  } catch (error: any) {
    console.error('Coach get player profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get player profile', error: error.message });
  }
}

/**
 * Admin: Get all coaches
 */
export async function getAllCoaches(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { status, sport } = req.query;

    const coaches = await prisma.coach.findMany({
      where: {
        ...(status && { status: status as string }),
        ...(sport && { sport: sport as string }),
      },
      include: {
        user: {
          select: {
            phone: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
        invitedByUser: {
          select: {
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { coaches },
    });
  } catch (error: any) {
    console.error('Get all coaches error:', error);
    res.status(500).json({ success: false, message: 'Failed to get coaches', error: error.message });
  }
}
