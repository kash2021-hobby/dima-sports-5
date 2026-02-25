import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateTeamId } from '../utils/helpers';

/**
 * Get active teams (for Preferred Teams selection)
 */
export async function getActiveTeams(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const teams = await prisma.team.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        teamId: true,
        name: true,
        location: true,
        status: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: { teams },
    });
  } catch (error: any) {
    console.error('Get active teams error:', error);
    res.status(500).json({ success: false, message: 'Failed to get teams', error: error.message });
  }
}

/**
 * Helper: get current coach entity for authenticated coach user
 */
async function getCurrentCoach(req: AuthRequest) {
  if (!req.userId) return null;

  const coach = await prisma.coach.findUnique({
    where: { userId: req.userId },
    select: {
      id: true,
      coachId: true,
      status: true,
      displayName: true,
    },
  });

  return coach;
}

/**
 * Coach: Get my teams (teams where I am assigned as coach)
 */
export async function getMyTeams(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const coach = await getCurrentCoach(req);

    if (!coach) {
      res.status(404).json({ success: false, message: 'Coach profile not found' });
      return;
    }

    if (coach.status !== 'ACTIVE') {
      res.status(403).json({ success: false, message: 'Only active coaches can manage teams' });
      return;
    }

    const assignments = await prisma.teamCoach.findMany({
      where: {
        coachId: coach.id,
        status: 'ACTIVE',
      },
      include: {
        team: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const teams = assignments.map((assignment) => ({
      ...assignment.team,
      coachRole: assignment.role,
      assignmentId: assignment.id,
    }));

    res.json({
      success: true,
      data: {
        coach: {
          id: coach.id,
          coachId: coach.coachId,
          displayName: coach.displayName,
          status: coach.status,
        },
        teams,
      },
    });
  } catch (error: any) {
    console.error('Get my teams error:', error);
    res.status(500).json({ success: false, message: 'Failed to get teams', error: error.message });
  }
}

/**
 * Coach: Request creation of a new team (admin approval required)
 */
export async function createTeamForCoach(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const coach = await getCurrentCoach(req);

    if (!coach) {
      res.status(404).json({ success: false, message: 'Coach profile not found' });
      return;
    }

    if (coach.status !== 'ACTIVE') {
      res.status(403).json({ success: false, message: 'Only active coaches can create teams' });
      return;
    }

    const { name, location } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, message: 'Team name is required' });
      return;
    }

    const request = await prisma.teamCreationRequest.create({
      data: {
        coachId: coach.id,
        requestedBy: req.userId,
        name: name.trim(),
        location: typeof location === 'string' ? location.trim() || null : null,
      },
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
      },
    });

    res.status(201).json({
      success: true,
      message: 'Team creation request submitted for admin approval',
      data: { request },
    });
  } catch (error: any) {
    console.error('Create team request error:', error);
    res.status(500).json({ success: false, message: 'Failed to create team request', error: error.message });
  }
}

/**
 * Coach: Update one of my teams (name / location / status)
 */
export async function updateMyTeam(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const coach = await getCurrentCoach(req);

    if (!coach) {
      res.status(404).json({ success: false, message: 'Coach profile not found' });
      return;
    }

    if (coach.status !== 'ACTIVE') {
      res.status(403).json({ success: false, message: 'Only active coaches can update teams' });
      return;
    }

    const { teamId } = req.params;
    const { name, location, status } = req.body;

    if (!teamId) {
      res.status(400).json({ success: false, message: 'Team ID is required' });
      return;
    }

    const team = await prisma.team.findUnique({
      where: { teamId },
      include: {
        coaches: {
          where: {
            coachId: coach.id,
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }

    if (!team.coaches.length) {
      res.status(403).json({ success: false, message: 'You are not assigned to this team' });
      return;
    }

    const data: any = {};
    if (typeof name === 'string' && name.trim()) data.name = name.trim();
    if (typeof location === 'string') data.location = location.trim() || null;
    if (typeof status === 'string' && status.trim()) data.status = status.trim();

    if (Object.keys(data).length === 0) {
      res.status(400).json({ success: false, message: 'No valid fields to update' });
      return;
    }

    const updated = await prisma.team.update({
      where: { id: team.id },
      data,
    });

    res.json({
      success: true,
      message: 'Team updated successfully',
      data: { team: updated },
    });
  } catch (error: any) {
    console.error('Update team error:', error);
    res.status(500).json({ success: false, message: 'Failed to update team', error: error.message });
  }
}

/**
 * Coach: Delete one of my teams
 */
export async function deleteMyTeam(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const coach = await getCurrentCoach(req);

    if (!coach) {
      res.status(404).json({ success: false, message: 'Coach profile not found' });
      return;
    }

    if (coach.status !== 'ACTIVE') {
      res.status(403).json({ success: false, message: 'Only active coaches can delete teams' });
      return;
    }

    const { teamId } = req.params;

    if (!teamId) {
      res.status(400).json({ success: false, message: 'Team ID is required' });
      return;
    }

    const team = await prisma.team.findUnique({
      where: { teamId },
      include: {
        coaches: {
          where: {
            coachId: coach.id,
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }

    if (!team.coaches.length) {
      res.status(403).json({ success: false, message: 'You are not assigned to this team' });
      return;
    }

    await prisma.team.delete({
      where: { id: team.id },
    });

    res.json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete team error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete team', error: error.message });
  }
}

/**
 * Admin: Get all teams with active coaches summary
 */
export async function adminGetAllTeams(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const teamsRaw = await prisma.team.findMany({
      include: {
        coaches: {
          include: {
            coach: {
              select: {
                id: true,
                coachId: true,
                displayName: true,
                status: true,
                user: {
                  select: {
                    phone: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const teams = teamsRaw.map((t) => {
      const assignments = Array.isArray(t.coaches) ? t.coaches : [];
      const createdByAssignment =
        assignments.find((a) => a.role === 'HEAD') || assignments[0] || null;
      const createdByCoach = createdByAssignment?.coach || null;

      const createdBy = createdByCoach
        ? {
            coachId: createdByCoach.coachId,
            displayName: createdByCoach.displayName,
            phone: createdByCoach.user?.phone || null,
            email: createdByCoach.user?.email || null,
            role: createdByAssignment?.role || null,
          }
        : null;

      // Backward compatible: keep `coaches` as ACTIVE assignments like before
      const activeCoaches = assignments.filter((a) => a.status === 'ACTIVE');

      return {
        ...t,
        coaches: activeCoaches,
        createdBy,
      };
    });

    res.json({
      success: true,
      data: { teams },
    });
  } catch (error: any) {
    console.error('Admin get all teams error:', error);
    res.status(500).json({ success: false, message: 'Failed to get teams', error: error.message });
  }
}

/**
 * Admin: Create a team (optionally assign a coach)
 */
export async function adminCreateTeam(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { name, location, status, coachId, coachRole } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, message: 'Team name is required' });
      return;
    }

    const teamId = generateTeamId();

    const result = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          teamId,
          name: name.trim(),
          location: location?.trim() || null,
          status: status?.trim() || 'ACTIVE',
        },
      });

      let assignment = null;

      if (coachId) {
        const coach = await tx.coach.findUnique({
          where: { coachId },
          select: { id: true, status: true },
        });

        if (!coach) {
          throw new Error('Coach not found for assignment');
        }

        if (coach.status !== 'ACTIVE') {
          throw new Error('Only active coaches can be assigned to a team');
        }

        assignment = await tx.teamCoach.create({
          data: {
            teamId: team.id,
            coachId: coach.id,
            role: coachRole?.trim() || 'HEAD',
          },
        });
      }

      return { team, assignment };
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: {
        team: result.team,
        assignment: result.assignment,
      },
    });
  } catch (error: any) {
    console.error('Admin create team error:', error);

    const message =
      error.message === 'Coach not found for assignment' ||
      error.message === 'Only active coaches can be assigned to a team'
        ? error.message
        : 'Failed to create team';

    res.status(500).json({ success: false, message, error: error.message });
  }
}

/**
 * Admin: Update team basic info
 */
export async function adminUpdateTeam(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { teamId } = req.params;
    const { name, location, status } = req.body;

    if (!teamId) {
      res.status(400).json({ success: false, message: 'Team ID is required' });
      return;
    }

    const team = await prisma.team.findUnique({
      where: { teamId },
      select: { id: true },
    });

    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }

    const data: any = {};
    if (typeof name === 'string' && name.trim()) data.name = name.trim();
    if (typeof location === 'string') data.location = location.trim() || null;
    if (typeof status === 'string' && status.trim()) data.status = status.trim();

    if (Object.keys(data).length === 0) {
      res.status(400).json({ success: false, message: 'No valid fields to update' });
      return;
    }

    const updated = await prisma.team.update({
      where: { id: team.id },
      data,
    });

    res.json({
      success: true,
      message: 'Team updated successfully',
      data: { team: updated },
    });
  } catch (error: any) {
    console.error('Admin update team error:', error);
    res.status(500).json({ success: false, message: 'Failed to update team', error: error.message });
  }
}

/**
 * Admin: Delete a team
 */
export async function adminDeleteTeam(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { teamId } = req.params;

    if (!teamId) {
      res.status(400).json({ success: false, message: 'Team ID is required' });
      return;
    }

    const team = await prisma.team.findUnique({
      where: { teamId },
      select: { id: true },
    });

    if (!team) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }

    await prisma.team.delete({
      where: { id: team.id },
    });

    res.json({
      success: true,
      message: 'Team deleted successfully',
    });
  } catch (error: any) {
    console.error('Admin delete team error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete team', error: error.message });
  }
}

/**
 * Admin: Get one team dashboard (info + assigned coaches)
 */
export async function adminGetTeamDetail(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { teamId } = req.params;

    if (!teamId) {
      res.status(400).json({ success: false, message: 'Team ID is required' });
      return;
    }

    const teamRaw = await prisma.team.findUnique({
      where: { teamId },
      include: {
        coaches: {
          include: {
            coach: {
              select: {
                id: true,
                coachId: true,
                displayName: true,
                status: true,
                user: {
                  select: {
                    phone: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!teamRaw) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }

    const assignments = Array.isArray(teamRaw.coaches) ? teamRaw.coaches : [];
    const createdByAssignment =
      assignments.find((a) => a.role === 'HEAD') || assignments[0] || null;
    const createdByCoach = createdByAssignment?.coach || null;
    const createdBy = createdByCoach
      ? {
          coachId: createdByCoach.coachId,
          displayName: createdByCoach.displayName,
          phone: createdByCoach.user?.phone || null,
          email: createdByCoach.user?.email || null,
          role: createdByAssignment?.role || null,
        }
      : null;

    const activeCoaches = assignments.filter((a) => a.status === 'ACTIVE');

    const team = {
      ...teamRaw,
      coaches: activeCoaches,
      createdBy,
    };

    res.json({
      success: true,
      data: { team },
    });
  } catch (error: any) {
    console.error('Admin get team detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to get team', error: error.message });
  }
}

/**
 * Admin: Get team players dashboard (players who preferred this team and are approved)
 */
export async function adminGetTeamPlayers(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { teamId } = req.params;

    if (!teamId) {
      res.status(400).json({ success: false, message: 'Team ID is required' });
      return;
    }

    const teamRaw = await prisma.team.findUnique({
      where: { teamId },
      include: {
        coaches: {
          include: {
            coach: {
              select: {
                coachId: true,
                displayName: true,
                user: {
                  select: { phone: true, email: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!teamRaw) {
      res.status(404).json({ success: false, message: 'Team not found' });
      return;
    }

    const assignments = Array.isArray(teamRaw.coaches) ? teamRaw.coaches : [];
    const createdByAssignment =
      assignments.find((a) => a.role === 'HEAD') || assignments[0] || null;
    const createdByCoach = createdByAssignment?.coach || null;
    const createdBy = createdByCoach
      ? {
          coachId: createdByCoach.coachId,
          displayName: createdByCoach.displayName,
          phone: createdByCoach.user?.phone || null,
          email: createdByCoach.user?.email || null,
          role: createdByAssignment?.role || null,
        }
      : null;

    const team = {
      id: teamRaw.id,
      teamId: teamRaw.teamId,
      name: teamRaw.name,
      location: teamRaw.location,
      createdBy,
    };

    // Fetch applications with preferredTeamIds and approved players
    const applications = await prisma.playerApplication.findMany({
      where: {
        status: 'APPROVED',
        preferredTeamIds: {
          not: null,
        },
      },
      include: {
        user: {
          include: {
            player: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const matchedApps = applications.filter((app) => {
      if (!app.user.player) return false;
      if (!app.preferredTeamIds) return false;

      let preferred: string[] = [];
      try {
        preferred = JSON.parse(app.preferredTeamIds || '[]');
      } catch {
        preferred = [];
      }

      return preferred.includes(team.teamId) || preferred.includes(team.id);
    });

    const applicationIds = matchedApps.map((app) => app.id);
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

    const players = matchedApps.map((app) => {
      const player = app.user.player!;
      const photo = player.photo || applicationPhotoMap.get(app.id) || null;
      return {
        playerId: player.playerId,
        playerInternalId: player.id,
        fullName: app.fullName,
        displayName: player.displayName,
        footballStatus: player.footballStatus,
        createdAt: player.createdAt,
        userId: app.user.id,
        userPhone: app.user.phone,
        userEmail: app.user.email,
        applicationId: app.id,
        applicationSubmittedAt: app.submittedAt,
        photo,
      };
    });

    res.json({
      success: true,
      data: {
        team,
        players,
      },
    });
  } catch (error: any) {
    console.error('Admin get team players error:', error);
    res.status(500).json({ success: false, message: 'Failed to get team players', error: error.message });
  }
}
