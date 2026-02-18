import { Request, Response } from 'express';
import prisma from '../config/database';
import { notifyTrialAssignment } from '../services/notification.service';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Admin: Assign trial to coach
 */
export async function assignTrial(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { trialId, coachId, scheduledDate, scheduledTime, venue } = req.body;

    if (!trialId || !coachId) {
      res.status(400).json({ success: false, message: 'trialId and coachId are required' });
      return;
    }

    const trial = await prisma.trial.findUnique({
      where: { id: trialId },
      include: {
        application: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!trial) {
      res.status(404).json({ success: false, message: 'Trial not found' });
      return;
    }

    if (trial.status !== 'PENDING') {
      res.status(400).json({ success: false, message: `Trial is already ${trial.status}` });
      return;
    }

    const coach = await prisma.coach.findUnique({
      where: { coachId },
      include: { user: true },
    });

    if (!coach || coach.status !== 'ACTIVE') {
      res.status(400).json({ success: false, message: 'Coach not found or not active' });
      return;
    }

    // Assign trial
    const updatedTrial = await prisma.trial.update({
      where: { id: trialId },
      data: {
        assignedCoachId: coach.id,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        scheduledTime,
        venue,
        status: 'PENDING', // Still pending until coach evaluates
      },
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
        application: {
          include: {
            user: true,
          },
        },
      },
    });

    // Notify candidate
    if (updatedTrial.scheduledDate) {
      await notifyTrialAssignment(
        trial.application.userId,
        updatedTrial.scheduledDate,
        coach.displayName || undefined
      );
    }

    res.json({
      success: true,
      message: 'Trial assigned successfully',
      data: { trial: updatedTrial },
    });
  } catch (error: any) {
    console.error('Assign trial error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign trial', error: error.message });
  }
}

/**
 * Coach: Get trials (assigned to coach OR unassigned pending trials)
 */
export async function getMyTrials(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'COACH') {
      res.status(403).json({ success: false, message: 'Coach access required' });
      return;
    }

    const coach = await prisma.coach.findUnique({
      where: { userId: req.userId },
      select: { id: true, status: true },
    });

    if (!coach) {
      res.status(404).json({ success: false, message: 'Coach profile not found' });
      return;
    }

    // Only active coaches can see trials
    if (coach.status !== 'ACTIVE') {
      res.status(403).json({ success: false, message: 'Only active coaches can view trials' });
      return;
    }

    const { status } = req.query;

    // Get trials that are:
    // 1. Assigned to this coach (with optional status filter), OR
    // 2. Unassigned pending trials (available for any coach to evaluate)
    const whereClause: any = {
      OR: [
        { assignedCoachId: coach.id }, // Trials assigned to this coach
        { 
          assignedCoachId: null, // Unassigned trials
          status: 'PENDING' // Only pending trials are available
        }
      ],
    };

    // If status filter is provided, apply it to assigned trials only
    // (unassigned trials are always PENDING)
    if (status) {
      whereClause.OR = [
        { 
          assignedCoachId: coach.id,
          status: status as string
        },
        ...(status === 'PENDING' ? [{ 
          assignedCoachId: null,
          status: 'PENDING'
        }] : [])
      ];
    }

    const trials = await prisma.trial.findMany({
      where: whereClause,
      include: {
        application: {
          // Include full submitted snapshot + linked user contact
          include: {
            user: {
              select: {
                phone: true,
                email: true,
              },
            },
          },
        },
        assignedCoach: {
          select: {
            id: true,
            coachId: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Attach submitted documents for each application
    const applicationIds = trials
      .filter((t) => t.application !== null)
      .map((t) => (t.application as any).id as string);

    let trialsWithDocuments = trials;

    if (applicationIds.length > 0) {
      const documents = await prisma.document.findMany({
        where: {
          ownerType: 'PLAYER_APPLICATION',
          ownerId: { in: applicationIds },
        },
        orderBy: { createdAt: 'asc' },
      });

      const documentsByApplicationId = documents.reduce<Record<string, typeof documents>>((acc, doc) => {
        if (!acc[doc.ownerId]) {
          acc[doc.ownerId] = [];
        }
        acc[doc.ownerId].push(doc);
        return acc;
      }, {});

      trialsWithDocuments = trials.map((trial: any) => {
        if (!trial.application) return trial;
        const appId = trial.application.id as string;
        const appDocuments = documentsByApplicationId[appId] || [];
        return {
          ...trial,
          application: {
            ...trial.application,
            documents: appDocuments,
          },
        };
      });
    }

    // Resolve preferred team IDs to names for coach view
    const allPreferredIds = new Set<string>();
    trialsWithDocuments.forEach((trial: any) => {
      const raw = trial.application?.preferredTeamIds;
      if (!raw || typeof raw !== 'string') return;
      try {
        const ids = JSON.parse(raw) as string[];
        if (Array.isArray(ids)) ids.forEach((id: string) => allPreferredIds.add(id));
      } catch {
        // ignore
      }
    });

    let teamIdToName: Record<string, string> = {};
    if (allPreferredIds.size > 0) {
      const teamList = await prisma.team.findMany({
        where: {
          OR: [
            { id: { in: Array.from(allPreferredIds) } },
            { teamId: { in: Array.from(allPreferredIds) } },
          ],
        },
        select: { id: true, teamId: true, name: true },
      });
      teamList.forEach((t) => {
        teamIdToName[t.id] = t.name;
        teamIdToName[t.teamId] = t.name;
      });
    }

    trialsWithDocuments = trialsWithDocuments.map((trial: any) => {
      if (!trial.application) return trial;
      const raw = trial.application.preferredTeamIds;
      let preferredTeamNames: string[] = [];
      if (raw && typeof raw === 'string') {
        try {
          const ids = JSON.parse(raw) as string[];
          if (Array.isArray(ids)) {
            preferredTeamNames = ids
              .map((id: string) => teamIdToName[id] || null)
              .filter((n): n is string => Boolean(n));
          }
        } catch {
          // ignore
        }
      }
      return {
        ...trial,
        application: {
          ...trial.application,
          preferredTeamNames,
        },
      };
    });

    res.json({
      success: true,
      data: { trials: trialsWithDocuments },
    });
  } catch (error: any) {
    console.error('Get my trials error:', error);
    const msg = error?.message || '';
    const schemaHint = /column.*does not exist|Unknown column|sport/i.test(msg)
      ? ' Run: npx prisma migrate deploy (with server stopped).'
      : '';
    res.status(500).json({
      success: false,
      message: 'Failed to get trials' + schemaHint,
      error: error.message,
    });
  }
}

/**
 * Coach: Evaluate trial
 */
export async function evaluateTrial(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'COACH') {
      res.status(403).json({ success: false, message: 'Coach access required' });
      return;
    }

    const { trialId } = req.params;
    const { outcome, notes } = req.body;

    if (!outcome) {
      res.status(400).json({ success: false, message: 'outcome is required (RECOMMENDED, NOT_RECOMMENDED, NEEDS_RETEST)' });
      return;
    }

    if (!['RECOMMENDED', 'NOT_RECOMMENDED', 'NEEDS_RETEST'].includes(outcome)) {
      res.status(400).json({ success: false, message: 'Invalid outcome. Must be RECOMMENDED, NOT_RECOMMENDED, or NEEDS_RETEST' });
      return;
    }

    const coach = await prisma.coach.findUnique({
      where: { userId: req.userId },
      select: { id: true },
    });

    if (!coach) {
      res.status(404).json({ success: false, message: 'Coach profile not found' });
      return;
    }

    const trial = await prisma.trial.findUnique({
      where: { id: trialId },
    });

    if (!trial) {
      res.status(404).json({ success: false, message: 'Trial not found' });
      return;
    }

    // Allow evaluation if:
    // 1. Trial is assigned to this coach, OR
    // 2. Trial is unassigned and pending (coach can claim it by evaluating)
    if (trial.assignedCoachId && trial.assignedCoachId !== coach.id) {
      res.status(403).json({ success: false, message: 'This trial is assigned to another coach' });
      return;
    }

    if (trial.status === 'COMPLETED') {
      res.status(400).json({ success: false, message: 'Trial already evaluated' });
      return;
    }

    // Update trial - auto-assign to coach if not already assigned
    const updatedTrial = await prisma.$transaction(async (tx) => {
      const trialUpdate = await tx.trial.update({
        where: { id: trialId },
        data: {
          assignedCoachId: trial.assignedCoachId || coach.id, // Auto-assign if unassigned
          outcome,
          notes: notes || null,
          evaluatedAt: new Date(),
          status: 'COMPLETED',
        },
      });

      // Update application trial status and application status
      const applicationUpdateData: any = { trialStatus: 'COMPLETED' };
      
      // If outcome is RECOMMENDED, set application status to UNDER_REVIEW for admin approval
      if (outcome === 'RECOMMENDED') {
        applicationUpdateData.status = 'UNDER_REVIEW';
      }
      // If outcome is NOT_RECOMMENDED, admin can still review but it's marked as such
      // If outcome is NEEDS_RETEST, keep status as SUBMITTED (user may need to resubmit)

      await tx.playerApplication.update({
        where: { id: trial.applicationId },
        data: applicationUpdateData,
      });

      return trialUpdate;
    });

    res.json({
      success: true,
      message: 'Trial evaluation submitted successfully',
      data: { trial: updatedTrial },
    });
  } catch (error: any) {
    console.error('Evaluate trial error:', error);
    res.status(500).json({ success: false, message: 'Failed to evaluate trial', error: error.message });
  }
}

/**
 * Admin: Get all trials
 */
export async function getAllTrials(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId || req.userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Admin access required' });
      return;
    }

    const { status, coachId } = req.query;

    const trials = await prisma.trial.findMany({
      where: {
        ...(status && { status: status as string }),
        ...(coachId && { assignedCoachId: coachId as string }),
      },
      include: {
        application: {
          include: {
            user: {
              select: {
                phone: true,
              },
            },
          },
        },
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
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { trials },
    });
  } catch (error: any) {
    console.error('Get all trials error:', error);
    res.status(500).json({ success: false, message: 'Failed to get trials', error: error.message });
  }
}
