import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateTournamentId } from '../utils/helpers';

function buildTournamentConfigSnapshot(tournament: any) {
  return {
    identity: {
      id: tournament.id,
      tournamentId: tournament.tournamentId,
      name: tournament.name,
      sport: tournament.sport,
      level: tournament.level,
      venue: tournament.venue,
      genderCategory: tournament.genderCategory,
      ageCategory: tournament.ageCategory,
    },
    format: {
      format: tournament.format,
      matchDurationMinutes: tournament.matchDurationMinutes,
      numberOfHalves: tournament.numberOfHalves,
      pointsForWin: tournament.pointsForWin,
      pointsForDraw: tournament.pointsForDraw,
      pointsForLoss: tournament.pointsForLoss,
      tieBreakRules: tournament.tieBreakRules,
    },
    schedule: {
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      registrationDeadline: tournament.registrationDeadline,
    },
    squadEligibility: {
      minSquadSize: tournament.minSquadSize,
      maxSquadSize: tournament.maxSquadSize,
      minAge: tournament.minAge,
      maxAge: tournament.maxAge,
      requiredDocuments: tournament.requiredDocuments,
    },
    finance: {
      entryFeeCents: tournament.entryFeeCents,
      prizePoolDescription: tournament.prizePoolDescription,
    },
  };
}

function validateTournamentForPublish(tournament: any): string | null {
  if (!tournament.name || !tournament.sport || !tournament.level) {
    return 'Tournament Identity (name, sport, level) is required before publishing.';
  }

  if (!tournament.genderCategory || !tournament.ageCategory) {
    return 'Tournament Identity (gender category and age category) is required before publishing.';
  }

  if (
    !tournament.matchDurationMinutes ||
    !tournament.numberOfHalves ||
    tournament.pointsForWin == null ||
    tournament.pointsForDraw == null ||
    tournament.pointsForLoss == null ||
    !tournament.tieBreakRules
  ) {
    return 'Format & Structure (duration, halves, points system, tie-break rules) must be fully configured before publishing.';
  }

  if (!tournament.startDate || !tournament.endDate || !tournament.registrationDeadline) {
    return 'Schedule (tournament window and registration deadline) must be fully configured before publishing.';
  }

  if (tournament.registrationDeadline > tournament.startDate) {
    return 'Registration deadline must be on or before the tournament start date.';
  }

  if (
    !tournament.minSquadSize ||
    !tournament.maxSquadSize ||
    tournament.minSquadSize <= 0 ||
    tournament.maxSquadSize <= 0 ||
    tournament.minSquadSize > tournament.maxSquadSize
  ) {
    return 'Squad size must have valid minimum and maximum values before publishing.';
  }

  if (tournament.minAge != null && tournament.maxAge != null && tournament.minAge > tournament.maxAge) {
    return 'Minimum age cannot be greater than maximum age.';
  }

  if (!tournament.requiredDocuments) {
    return 'Required documents must be configured before publishing.';
  }

  if (tournament.entryFeeCents == null || tournament.entryFeeCents < 0) {
    return 'Entry fee must be a non-negative amount before publishing.';
  }

  if (!tournament.prizePoolDescription) {
    return 'Prize pool must be described before publishing.';
  }

  return null;
}

/**
 * Admin: Create a new tournament in DRAFT status
 */
export async function createTournament(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const {
      name,
      sport,
      level,
      genderCategory,
      ageCategory,
      venue,
      format,
      numberOfTeams,
      startDate,
      endDate,
      registrationDeadline,
      matchDurationMinutes,
      numberOfHalves,
      pointsForWin,
      pointsForDraw,
      pointsForLoss,
      tieBreakRules,
      minSquadSize,
      maxSquadSize,
      minAge,
      maxAge,
      requiredDocuments,
      entryFeeCents,
      prizePoolDescription,
    } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, message: 'Tournament name is required' });
      return;
    }

    if (!sport || typeof sport !== 'string' || !sport.trim()) {
      res.status(400).json({ success: false, message: 'Sport is required' });
      return;
    }

    if (!level || typeof level !== 'string' || !level.trim()) {
      res.status(400).json({ success: false, message: 'Level is required' });
      return;
    }

    const tournamentId = generateTournamentId();

    const created = await prisma.tournament.create({
      data: {
        tournamentId,
        name: name.trim(),
        sport: sport.trim(),
        level: level.trim(),
        genderCategory: typeof genderCategory === 'string' ? genderCategory.trim() || null : null,
        ageCategory: typeof ageCategory === 'string' ? ageCategory.trim() || null : null,
        venue: typeof venue === 'string' ? venue.trim() || null : null,
        format: typeof format === 'string' ? format.trim() || null : null,
        numberOfTeams: typeof numberOfTeams === 'number' ? numberOfTeams : null,
        status: 'DRAFT',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        matchDurationMinutes: typeof matchDurationMinutes === 'number' ? matchDurationMinutes : null,
        numberOfHalves: typeof numberOfHalves === 'number' ? numberOfHalves : null,
        pointsForWin: typeof pointsForWin === 'number' ? pointsForWin : 3,
        pointsForDraw: typeof pointsForDraw === 'number' ? pointsForDraw : 1,
        pointsForLoss: typeof pointsForLoss === 'number' ? pointsForLoss : 0,
        tieBreakRules: typeof tieBreakRules === 'string' ? tieBreakRules.trim() || null : null,
        minSquadSize: typeof minSquadSize === 'number' ? minSquadSize : null,
        maxSquadSize: typeof maxSquadSize === 'number' ? maxSquadSize : null,
        minAge: typeof minAge === 'number' ? minAge : null,
        maxAge: typeof maxAge === 'number' ? maxAge : null,
        requiredDocuments: typeof requiredDocuments === 'string' ? requiredDocuments.trim() || null : null,
        entryFeeCents: typeof entryFeeCents === 'number' ? entryFeeCents : null,
        prizePoolDescription:
          typeof prizePoolDescription === 'string' ? prizePoolDescription.trim() || null : null,
        createdBy: req.userId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Tournament created in DRAFT status',
      data: { tournament: created },
    });
  } catch (error: any) {
    console.error('Create tournament error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to create tournament', error: error.message });
  }
}

/**
 * Admin: Update tournament configuration (only while DRAFT)
 */
export async function updateTournament(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { tournamentId } = req.params;

    if (!tournamentId) {
      res.status(400).json({ success: false, message: 'Tournament ID is required' });
      return;
    }

    const existing = await prisma.tournament.findUnique({
      where: { tournamentId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Tournament not found' });
      return;
    }

    if (existing.status !== 'DRAFT') {
      res.status(400).json({
        success: false,
        message: `Tournament is ${existing.status}. Only DRAFT tournaments can be edited.`,
      });
      return;
    }

    const {
      name,
      sport,
      level,
      genderCategory,
      ageCategory,
      venue,
      format,
      startDate,
      endDate,
      registrationDeadline,
      matchDurationMinutes,
      numberOfHalves,
      pointsForWin,
      pointsForDraw,
      pointsForLoss,
      tieBreakRules,
      minSquadSize,
      maxSquadSize,
      minAge,
      maxAge,
      requiredDocuments,
      entryFeeCents,
      prizePoolDescription,
      numberOfTeams,
      status,
    } = req.body || {};

    const data: any = {};

    if (typeof name === 'string') data.name = name.trim() || existing.name;
    if (typeof sport === 'string') data.sport = sport.trim() || existing.sport;
    if (typeof level === 'string') data.level = level.trim() || existing.level;
    if (typeof genderCategory === 'string') {
      data.genderCategory = genderCategory.trim() || null;
    }
    if (typeof ageCategory === 'string') {
      data.ageCategory = ageCategory.trim() || null;
    }
    if (typeof venue === 'string') {
      data.venue = venue.trim() || null;
    }
    if (typeof format === 'string') {
      data.format = format.trim() || null;
    }
    if (typeof numberOfTeams === 'number') data.numberOfTeams = numberOfTeams;
    if (typeof startDate === 'string') data.startDate = startDate ? new Date(startDate) : null;
    if (typeof endDate === 'string') data.endDate = endDate ? new Date(endDate) : null;
    if (typeof registrationDeadline === 'string') {
      data.registrationDeadline = registrationDeadline ? new Date(registrationDeadline) : null;
    }

    if (typeof matchDurationMinutes === 'number') data.matchDurationMinutes = matchDurationMinutes;
    if (typeof numberOfHalves === 'number') data.numberOfHalves = numberOfHalves;
    if (typeof pointsForWin === 'number') data.pointsForWin = pointsForWin;
    if (typeof pointsForDraw === 'number') data.pointsForDraw = pointsForDraw;
    if (typeof pointsForLoss === 'number') data.pointsForLoss = pointsForLoss;
    if (typeof tieBreakRules === 'string') data.tieBreakRules = tieBreakRules.trim() || null;

    if (typeof minSquadSize === 'number') data.minSquadSize = minSquadSize;
    if (typeof maxSquadSize === 'number') data.maxSquadSize = maxSquadSize;
    if (typeof minAge === 'number') data.minAge = minAge;
    if (typeof maxAge === 'number') data.maxAge = maxAge;
    if (typeof requiredDocuments === 'string') {
      data.requiredDocuments = requiredDocuments.trim() || null;
    }

    if (typeof entryFeeCents === 'number') data.entryFeeCents = entryFeeCents;
    if (typeof prizePoolDescription === 'string') {
      data.prizePoolDescription = prizePoolDescription.trim() || null;
    }

    // Do not allow status changes here; status transitions have dedicated endpoints
    if (typeof status === 'string' && status.trim() && status.trim() !== existing.status) {
      res.status(400).json({
        success: false,
        message: 'Status cannot be changed via update. Use publish/ongoing/complete endpoints.',
      });
      return;
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({ success: false, message: 'No valid fields to update' });
      return;
    }

    const updated = await prisma.tournament.update({
      where: { id: existing.id },
      data,
    });

    res.json({
      success: true,
      message: 'Tournament updated successfully',
      data: { tournament: updated },
    });
  } catch (error: any) {
    console.error('Update tournament error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to update tournament', error: error.message });
  }
}

/**
 * Admin: List tournaments with basic filters
 */
export async function listTournaments(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { status, sport, level, search } = req.query as {
      status?: string;
      sport?: string;
      level?: string;
      search?: string;
    };

    const where: any = {};

    if (status && typeof status === 'string') {
      where.status = status.toUpperCase();
    }
    if (sport && typeof sport === 'string') {
      where.sport = sport.toUpperCase();
    }
    if (level && typeof level === 'string') {
      where.level = level.toUpperCase();
    }
    if (search && typeof search === 'string' && search.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { startDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: { tournaments },
    });
  } catch (error: any) {
    console.error('List tournaments error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to list tournaments', error: error.message });
  }
}

/**
 * Admin: Get full tournament configuration and coach applications
 */
export async function getTournamentById(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { tournamentId } = req.params;

    if (!tournamentId) {
      res.status(400).json({ success: false, message: 'Tournament ID is required' });
      return;
    }

    const tournament = await prisma.tournament.findUnique({
      where: { tournamentId },
      include: {
        applications: {
          include: {
            coach: {
              select: {
                id: true,
                coachId: true,
                displayName: true,
                status: true,
              },
            },
            applicationPlayers: {
              include: {
                player: {
                  select: {
                    id: true,
                    playerId: true,
                    displayName: true,
                    footballStatus: true,
                  },
                },
              },
            },
            captain: {
              select: {
                id: true,
                playerId: true,
                displayName: true,
              },
            },
          },
          orderBy: { submittedAt: 'asc' },
        },
        configSnapshots: {
          orderBy: { snapshotAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!tournament) {
      res.status(404).json({ success: false, message: 'Tournament not found' });
      return;
    }

    const latestSnapshot = tournament.configSnapshots[0] || null;

    const applications = tournament.applications.map((app) => {
      const captainId = app.captainPlayerId;
      return {
        id: app.id,
        status: app.status,
        submittedAt: app.submittedAt,
        teamName: app.teamName,
        notes: app.notes,
        coach: app.coach,
        players: app.applicationPlayers.map((ap) => ({
          id: ap.player.id,
          playerId: ap.player.playerId,
          displayName: ap.player.displayName,
          footballStatus: ap.player.footballStatus,
          isCaptain: captainId === ap.playerId,
        })),
      };
    });

    const { configSnapshots, applications: _apps, ...tournamentData } = tournament as any;

    res.json({
      success: true,
      data: {
        tournament: tournamentData,
        latestSnapshot,
        applications,
      },
    });
  } catch (error: any) {
    console.error('Get tournament error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to get tournament', error: error.message });
  }
}

/**
 * Admin: Publish a tournament (DRAFT -> PUBLISHED) with configuration snapshot
 */
export async function publishTournament(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { tournamentId } = req.params;

    if (!tournamentId) {
      res.status(400).json({ success: false, message: 'Tournament ID is required' });
      return;
    }

    const existing = await prisma.tournament.findUnique({
      where: { tournamentId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Tournament not found' });
      return;
    }

    if (existing.status !== 'DRAFT') {
      res.status(400).json({
        success: false,
        message: `Tournament is ${existing.status}. Only DRAFT tournaments can be published.`,
      });
      return;
    }

    const validationError = validateTournamentForPublish(existing);

    if (validationError) {
      res.status(400).json({ success: false, message: validationError });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.tournament.update({
        where: { id: existing.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedBy: req.userId,
        },
      });

      const snapshotConfig = buildTournamentConfigSnapshot(updated);

      const snapshot = await tx.tournamentConfigSnapshot.create({
        data: {
          tournamentDbId: updated.id,
          snapshotBy: req.userId ?? null,
          configJson: JSON.stringify(snapshotConfig),
        },
      });

      return { updated, snapshot };
    });

    res.json({
      success: true,
      message: 'Tournament published successfully',
      data: {
        tournament: result.updated,
        snapshot: {
          id: result.snapshot.id,
          snapshotAt: result.snapshot.snapshotAt,
        },
      },
    });
  } catch (error: any) {
    console.error('Publish tournament error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to publish tournament', error: error.message });
  }
}

/**
 * Admin: Mark a tournament as ONGOING
 */
export async function markTournamentOngoing(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { tournamentId } = req.params;

    if (!tournamentId) {
      res.status(400).json({ success: false, message: 'Tournament ID is required' });
      return;
    }

    const existing = await prisma.tournament.findUnique({
      where: { tournamentId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Tournament not found' });
      return;
    }

    if (existing.status !== 'PUBLISHED') {
      res.status(400).json({
        success: false,
        message: `Tournament is ${existing.status}. Only PUBLISHED tournaments can be marked as ONGOING.`,
      });
      return;
    }

    const updated = await prisma.tournament.update({
      where: { id: existing.id },
      data: {
        status: 'ONGOING',
        ongoingSince: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Tournament marked as ONGOING',
      data: { tournament: updated },
    });
  } catch (error: any) {
    console.error('Mark tournament ongoing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark tournament as ongoing',
      error: error.message,
    });
  }
}

/**
 * Admin: Mark a tournament as COMPLETED
 */
export async function completeTournament(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { tournamentId } = req.params;

    if (!tournamentId) {
      res.status(400).json({ success: false, message: 'Tournament ID is required' });
      return;
    }

    const existing = await prisma.tournament.findUnique({
      where: { tournamentId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Tournament not found' });
      return;
    }

    if (existing.status !== 'ONGOING' && existing.status !== 'PUBLISHED') {
      res.status(400).json({
        success: false,
        message:
          'Only ONGOING or PUBLISHED tournaments can be marked as COMPLETED at this time.',
      });
      return;
    }

    const updated = await prisma.tournament.update({
      where: { id: existing.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Tournament marked as COMPLETED',
      data: { tournament: updated },
    });
  } catch (error: any) {
    console.error('Complete tournament error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete tournament',
      error: error.message,
    });
  }
}

/**
 * Admin: Get (placeholder) standings for a tournament
 */
export async function getTournamentStandings(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { tournamentId } = req.params;

    if (!tournamentId) {
      res.status(400).json({ success: false, message: 'Tournament ID is required' });
      return;
    }

    const tournament = await prisma.tournament.findUnique({
      where: { tournamentId },
    });

    if (!tournament) {
      res.status(404).json({ success: false, message: 'Tournament not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        tournamentId: tournament.tournamentId,
        sport: tournament.sport,
        level: tournament.level,
        pointsSystem: {
          win: tournament.pointsForWin,
          draw: tournament.pointsForDraw,
          loss: tournament.pointsForLoss,
        },
        tieBreakRules: tournament.tieBreakRules,
        standings: [] as any[],
      },
    });
  } catch (error: any) {
    console.error('Get tournament standings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tournament standings',
      error: error.message,
    });
  }
}

/**
 * Admin: Get referee assignments for a tournament
 */
export async function getTournamentRefereeAssignments(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { tournamentId } = req.params;
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    if (!tournamentId) {
      res.status(400).json({ success: false, message: 'Tournament ID is required' });
      return;
    }

    const tournament = await prisma.tournament.findUnique({
      where: { tournamentId },
      select: { id: true },
    });

    if (!tournament) {
      res.status(404).json({ success: false, message: 'Tournament not found' });
      return;
    }

    const where: any = {
      tournamentId: tournament.id,
    };

    if (startDate || endDate) {
      where.assignedDate = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!Number.isNaN(start.getTime())) {
          where.assignedDate.gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!Number.isNaN(end.getTime())) {
          where.assignedDate.lte = end;
        }
      }
    }

    const assignments = await prisma.tournamentRefereeAssignment.findMany({
      where,
      orderBy: [{ assignedDate: 'asc' }, { createdAt: 'asc' }],
      include: {
        referee: {
          select: {
            id: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
    });

    const byDate: Record<
      string,
      Array<{
        id: string;
        role: string;
        assignedDate: Date;
        referee: { id: string; phone: string; role: string; status: string };
      }>
    > = {};

    for (const a of assignments) {
      const key = a.assignedDate.toISOString().slice(0, 10);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push({
        id: a.id,
        role: a.role,
        assignedDate: a.assignedDate,
        referee: a.referee,
      });
    }

    res.json({
      success: true,
      data: {
        tournamentId,
        assignmentsByDate: byDate,
      },
    });
  } catch (error: any) {
    console.error('Get tournament referee assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tournament referee assignments',
      error: error.message,
    });
  }
}

/**
 * Admin: Assign a referee to a tournament date
 */
export async function assignTournamentReferee(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { tournamentId } = req.params;
    const { refereeId, date, role } = req.body as {
      refereeId?: string;
      date?: string;
      role?: string;
    };

    if (!tournamentId) {
      res.status(400).json({ success: false, message: 'Tournament ID is required' });
      return;
    }

    if (!refereeId || !date || !role) {
      res
        .status(400)
        .json({ success: false, message: 'refereeId, date, and role are required' });
      return;
    }

    const tournament = await prisma.tournament.findUnique({
      where: { tournamentId },
      select: { id: true, startDate: true, endDate: true },
    });

    if (!tournament) {
      res.status(404).json({ success: false, message: 'Tournament not found' });
      return;
    }

    const referee = await prisma.user.findUnique({
      where: { id: refereeId },
      select: { id: true, role: true, status: true },
    });

    if (!referee || referee.role !== 'REFEREE') {
      res
        .status(400)
        .json({ success: false, message: 'Referee must be a valid user with role=REFEREE' });
      return;
    }

    if (referee.status === 'BLOCKED' || referee.status === 'SUSPENDED') {
      res
        .status(400)
        .json({ success: false, message: 'Referee account is not active for assignments' });
      return;
    }

    const assignedDate = new Date(date);
    if (Number.isNaN(assignedDate.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    if (tournament.startDate && assignedDate < tournament.startDate) {
      res.status(400).json({
        success: false,
        message: 'Assigned date cannot be before tournament start date',
      });
      return;
    }

    if (tournament.endDate && assignedDate > tournament.endDate) {
      res.status(400).json({
        success: false,
        message: 'Assigned date cannot be after tournament end date',
      });
      return;
    }

    const normalizedRole = String(role).trim() || 'CENTER';

    const existing = await prisma.tournamentRefereeAssignment.findFirst({
      where: {
        tournamentId: tournament.id,
        refereeId,
        assignedDate,
      },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        message: 'Referee is already assigned for this date in this tournament',
      });
      return;
    }

    const assignment = await prisma.tournamentRefereeAssignment.create({
      data: {
        tournamentId: tournament.id,
        refereeId,
        assignedDate,
        role: normalizedRole,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Referee assigned successfully',
      data: { assignmentId: assignment.id },
    });
  } catch (error: any) {
    console.error('Assign tournament referee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign referee',
      error: error.message,
    });
  }
}

/**
 * Admin: Update a referee assignment (role)
 */
export async function updateTournamentRefereeAssignment(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { assignmentId } = req.params;
    const { role } = req.body as { role?: string };

    if (!assignmentId) {
      res.status(400).json({ success: false, message: 'Assignment ID is required' });
      return;
    }

    if (!role || !String(role).trim()) {
      res.status(400).json({ success: false, message: 'Role is required' });
      return;
    }

    const updated = await prisma.tournamentRefereeAssignment.update({
      where: { id: assignmentId },
      data: { role: String(role).trim() },
    });

    res.json({
      success: true,
      message: 'Referee assignment updated successfully',
      data: { assignmentId: updated.id },
    });
  } catch (error: any) {
    console.error('Update tournament referee assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update referee assignment',
      error: error.message,
    });
  }
}

/**
 * Admin: Remove a referee assignment
 */
export async function removeTournamentRefereeAssignment(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { assignmentId } = req.params;

    if (!assignmentId) {
      res.status(400).json({ success: false, message: 'Assignment ID is required' });
      return;
    }

    await prisma.tournamentRefereeAssignment.delete({
      where: { id: assignmentId },
    });

    res.json({
      success: true,
      message: 'Referee assignment removed successfully',
    });
  } catch (error: any) {
    console.error('Remove tournament referee assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove referee assignment',
      error: error.message,
    });
  }
}

/**
 * Coach helper: get current coach entity
 */
async function getCurrentCoach(req: AuthRequest) {
  if (!req.userId) return null;

  const coach = await prisma.coach.findUnique({
    where: { userId: req.userId },
    select: {
      id: true,
      coachId: true,
      status: true,
      sport: true,
      displayName: true,
    },
  });

  return coach;
}

/**
 * Coach: list published tournaments as announcements
 */
export async function getCoachTournamentAnnouncements(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'COACH') {
      res.status(403).json({ success: false, message: 'Coach access required' });
      return;
    }

    const coach = await getCurrentCoach(req);

    if (!coach) {
      res.status(404).json({ success: false, message: 'Coach profile not found' });
      return;
    }

    if (coach.status !== 'ACTIVE') {
      res
        .status(403)
        .json({ success: false, message: 'Only active coaches can view tournaments' });
      return;
    }

    const now = new Date();

    const tournaments = await prisma.tournament.findMany({
      where: {
        status: 'PUBLISHED',
        sport: coach.sport,
        OR: [
          { registrationDeadline: null },
          { registrationDeadline: { gte: now } },
        ],
      },
      orderBy: [
        { startDate: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        applications: {
          where: { coachId: coach.id },
          select: {
            id: true,
            status: true,
            submittedAt: true,
          },
        },
      },
    });

    const announcements = tournaments.map((t) => {
      const myApp = t.applications[0];
      const isRegistrationOpen =
        !t.registrationDeadline || t.registrationDeadline >= now;
      return {
        id: t.id,
        tournamentId: t.tournamentId,
        name: t.name,
        sport: t.sport,
        level: t.level,
        genderCategory: t.genderCategory,
        ageCategory: t.ageCategory,
        status: t.status,
        startDate: t.startDate,
        endDate: t.endDate,
        registrationDeadline: t.registrationDeadline,
        minSquadSize: t.minSquadSize,
        maxSquadSize: t.maxSquadSize,
        isRegistrationOpen,
        applicationStatus: myApp?.status ?? 'NOT_APPLIED',
        applicationSubmittedAt: myApp?.submittedAt ?? null,
      };
    });

    res.json({
      success: true,
      data: {
        coach,
        tournaments: announcements,
      },
    });
  } catch (error: any) {
    console.error('Get coach tournament announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tournaments for coach',
      error: error.message,
    });
  }
}

/**
 * Coach: submit or update a tournament application with squad and captain
 */
export async function submitTournamentApplication(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'COACH') {
      res.status(403).json({ success: false, message: 'Coach access required' });
      return;
    }

    const coach = await getCurrentCoach(req);

    if (!coach) {
      res.status(404).json({ success: false, message: 'Coach profile not found' });
      return;
    }

    if (coach.status !== 'ACTIVE') {
      res
        .status(403)
        .json({ success: false, message: 'Only active coaches can apply to tournaments' });
      return;
    }

    const { tournamentId } = req.params;

    if (!tournamentId) {
      res.status(400).json({ success: false, message: 'Tournament ID is required' });
      return;
    }

    const tournament = await prisma.tournament.findUnique({
      where: { tournamentId },
    });

    if (!tournament || tournament.status !== 'PUBLISHED') {
      res.status(400).json({
        success: false,
        message: 'Only published tournaments can accept applications',
      });
      return;
    }

    const now = new Date();

    if (tournament.registrationDeadline && tournament.registrationDeadline < now) {
      res.status(400).json({
        success: false,
        message: 'Registration deadline has passed for this tournament',
      });
      return;
    }

    const {
      teamName,
      notes,
      playerIds,
      captainPlayerId,
    }: { teamName?: string; notes?: string; playerIds?: string[]; captainPlayerId?: string } =
      req.body || {};

    if (!teamName || typeof teamName !== 'string' || !teamName.trim()) {
      res.status(400).json({ success: false, message: 'Team name is required' });
      return;
    }

    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      res.status(400).json({ success: false, message: 'At least one player must be selected' });
      return;
    }

    if (!captainPlayerId || typeof captainPlayerId !== 'string') {
      res.status(400).json({ success: false, message: 'A team captain must be selected' });
      return;
    }

    if (!playerIds.includes(captainPlayerId)) {
      res.status(400).json({
        success: false,
        message: 'Captain must be one of the selected players',
      });
      return;
    }

    if (tournament.minSquadSize && playerIds.length < tournament.minSquadSize) {
      res.status(400).json({
        success: false,
        message: `Minimum squad size is ${tournament.minSquadSize} players`,
      });
      return;
    }

    if (tournament.maxSquadSize && playerIds.length > tournament.maxSquadSize) {
      res.status(400).json({
        success: false,
        message: `Maximum squad size is ${tournament.maxSquadSize} players`,
      });
      return;
    }

    // NOTE: For now we trust that playerIds come from coach's active roster.
    // A future enhancement can validate player-coach relationships.

    const result = await prisma.$transaction(async (tx) => {
      const existingApp = await tx.tournamentApplication.findFirst({
        where: {
          tournamentDbId: tournament.id,
          coachId: coach.id,
        },
      });

      let application;

      if (existingApp) {
        application = await tx.tournamentApplication.update({
          where: { id: existingApp.id },
          data: {
            teamName: teamName.trim(),
            notes: typeof notes === 'string' ? notes.trim() || null : existingApp.notes,
            status: 'APPLIED',
            submittedAt: new Date(),
            captainPlayerId,
          },
        });

        await tx.tournamentApplicationPlayer.deleteMany({
          where: { applicationId: existingApp.id },
        });
      } else {
        application = await tx.tournamentApplication.create({
          data: {
            tournamentDbId: tournament.id,
            coachId: coach.id,
            teamName: teamName.trim(),
            notes: typeof notes === 'string' ? notes.trim() || null : null,
            status: 'APPLIED',
            submittedAt: new Date(),
            captainPlayerId,
          },
        });
      }

      if (playerIds.length > 0) {
        await tx.tournamentApplicationPlayer.createMany({
          data: playerIds.map((playerId) => ({
            applicationId: application.id,
            playerId,
          })),
          skipDuplicates: true,
        });
      }

      return application;
    });

    res.json({
      success: true,
      message: 'Tournament application submitted successfully',
      data: {
        applicationId: result.id,
      },
    });
  } catch (error: any) {
    console.error('Submit tournament application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit tournament application',
      error: error.message,
    });
  }
}

