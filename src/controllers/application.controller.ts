import { Request, Response } from 'express';
import prisma from '../config/database';
import { notifyApplicationStatus, notifyTrialAssignment } from '../services/notification.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { validateDateOfBirth, formatPhone, isValidPhone } from '../utils/helpers';

/**
 * Create or update player application (DRAFT)
 */
export async function createOrUpdateApplication(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const {
      fullName,
      dateOfBirth,
      gender,
      sport,
      primaryPosition,
      dominantFoot,
      height,
      weight,
      city,
      state,
      district,
      pincode,
      nationality,
      playerPhone,
      playerEmail,
      preferredTeamIds,
      emergencyContactsJson,
      aadhaarNumber,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
    } = req.body;

    const normalizeStringOrArray = (value: unknown): string | undefined => {
      if (Array.isArray(value)) return JSON.stringify(value);
      if (typeof value === 'string') return value;
      return undefined;
    };

    // Validation
    if (!fullName || !dateOfBirth || !gender || !playerPhone || !emergencyContactName || !emergencyContactPhone) {
      res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: fullName, dateOfBirth, gender, playerPhone, emergencyContactName, emergencyContactPhone' 
      });
      return;
    }

    // Validate date of birth
    const dob = new Date(dateOfBirth);
    if (!validateDateOfBirth(dob)) {
      res.status(400).json({ success: false, message: 'Invalid date of birth' });
      return;
    }

    // Validate emergency contact phone
    const formattedPhone = formatPhone(emergencyContactPhone);
    if (!isValidPhone(formattedPhone)) {
      res.status(400).json({ success: false, message: 'Invalid emergency contact phone number' });
      return;
    }

    // Validate player phone
    const formattedPlayerPhone = formatPhone(playerPhone);
    if (!isValidPhone(formattedPlayerPhone)) {
      res.status(400).json({ success: false, message: 'Invalid player phone number' });
      return;
    }

    // Validate pincode (optional)
    if (pincode && !/^\d{6}$/.test(String(pincode))) {
      res.status(400).json({ success: false, message: 'Invalid pincode (must be 6 digits)' });
      return;
    }

    // Enforce phone uniqueness between player and emergency contacts (including JSON list)
    const normalizeForCompare = (value: unknown): string => String(value || '').replace(/\D/g, '');
    const playerPhoneCompare = normalizeForCompare(playerPhone);
    const primaryEmergencyCompare = normalizeForCompare(emergencyContactPhone);

    if (playerPhoneCompare && primaryEmergencyCompare && playerPhoneCompare === primaryEmergencyCompare) {
      res.status(400).json({
        success: false,
        message: 'Emergency contact phone number must be different from player mobile number',
      });
      return;
    }

    let emergencyPhonesFromJson: string[] = [];
    if (typeof emergencyContactsJson === 'string' && emergencyContactsJson.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(emergencyContactsJson) as unknown;
        if (Array.isArray(parsed)) {
          emergencyPhonesFromJson = parsed
            .map((c: any) => normalizeForCompare(c?.phone))
            .filter((p: string) => typeof p === 'string' && p.length > 0);
        }
      } catch {
        // ignore JSON parsing issues; they are not critical for uniqueness
      }
    }

    if (
      playerPhoneCompare &&
      emergencyPhonesFromJson.some((p) => p === playerPhoneCompare)
    ) {
      res.status(400).json({
        success: false,
        message: 'Emergency contact phone numbers must be different from player mobile number',
      });
      return;
    }

    const uniqueEmergencyPhones = new Set(emergencyPhonesFromJson);
    if (uniqueEmergencyPhones.size !== emergencyPhonesFromJson.length) {
      res.status(400).json({
        success: false,
        message: 'Emergency contact phone numbers must be different from each other',
      });
      return;
    }

    const normalizeAadhaar = (value: unknown): string => String(value || '').replace(/\D/g, '');
    const aadhaarNormalized = normalizeAadhaar(aadhaarNumber);

    if (aadhaarNormalized && !/^\d{12}$/.test(aadhaarNormalized)) {
      res.status(400).json({
        success: false,
        message: 'Invalid Aadhaar number (must be exactly 12 digits)',
      });
      return;
    }

    // Check for duplicate application (same phone + DOB + name)
    const existingApp = await prisma.playerApplication.findUnique({
      where: { userId: req.userId },
    });

    if (existingApp && existingApp.status !== 'DRAFT') {
      res.status(400).json({
        success: false,
        message: 'Application is already submitted and cannot be edited',
      });
      return;
    }

    // Check for duplicates across all users
    const duplicateCheck = await prisma.playerApplication.findFirst({
      where: {
        fullName: fullName.trim(),
        dateOfBirth: dob,
        status: { not: 'REJECTED' },
        userId: { not: req.userId },
      },
    });

    if (duplicateCheck) {
      res.status(400).json({ 
        success: false, 
        message: 'An application with this name and date of birth already exists' 
      });
      return;
    }

    // Check Aadhaar uniqueness across all users (if provided)
    if (aadhaarNormalized) {
      const existingWithAadhaar = await prisma.playerApplication.findFirst({
        where: {
          aadhaarNumber: aadhaarNormalized,
          userId: { not: req.userId },
        },
      });

      if (existingWithAadhaar) {
        res.status(400).json({
          success: false,
          message: 'This Aadhaar number is already registered',
        });
        return;
      }
    }

    // Persist player email to User when provided
    if (playerEmail !== undefined) {
      const emailValue = typeof playerEmail === 'string' ? playerEmail.trim() : '';
      await prisma.user.update({
        where: { id: req.userId },
        data: { email: emailValue || null },
      });
    }

    // Create or update application
    const application = existingApp
      ? await prisma.playerApplication.update({
          where: { userId: req.userId },
          data: {
            fullName: fullName.trim(),
            dateOfBirth: dob,
            gender,
            sport: sport && typeof sport === 'string' ? sport.trim() : null,
            primaryPosition: normalizeStringOrArray(primaryPosition),
            dominantFoot: normalizeStringOrArray(dominantFoot),
            height,
            weight,
            city,
            state,
            district: district ? String(district) : null,
            pincode: pincode ? String(pincode) : null,
            nationality: nationality ? String(nationality) : null,
            playerPhone: formattedPlayerPhone,
            aadhaarNumber: aadhaarNormalized || null,
            preferredTeamIds: normalizeStringOrArray(preferredTeamIds),
            emergencyContactsJson: typeof emergencyContactsJson === 'string' ? emergencyContactsJson : null,
            emergencyContactName: emergencyContactName.trim(),
            emergencyContactPhone: formattedPhone,
            emergencyContactRelation,
            status: 'DRAFT', // Keep as draft until submitted
          },
        })
      : await prisma.playerApplication.create({
          data: {
            userId: req.userId,
            fullName: fullName.trim(),
            dateOfBirth: dob,
            gender,
            sport: sport && typeof sport === 'string' ? sport.trim() : null,
            primaryPosition: normalizeStringOrArray(primaryPosition),
            dominantFoot: normalizeStringOrArray(dominantFoot),
            height,
            weight,
            city,
            state,
            district: district ? String(district) : null,
            pincode: pincode ? String(pincode) : null,
            nationality: nationality ? String(nationality) : null,
            playerPhone: formattedPlayerPhone,
            aadhaarNumber: aadhaarNormalized || null,
            preferredTeamIds: normalizeStringOrArray(preferredTeamIds),
            emergencyContactsJson: typeof emergencyContactsJson === 'string' ? emergencyContactsJson : null,
            emergencyContactName: emergencyContactName.trim(),
            emergencyContactPhone: formattedPhone,
            emergencyContactRelation,
            status: 'DRAFT',
          },
        });

    res.json({
      success: true,
      message: 'Application saved as draft',
      data: { application },
    });
  } catch (error: any) {
    console.error('Create application error:', error);
    res.status(500).json({ success: false, message: 'Failed to save application', error: error.message });
  }
}

/**
 * Get user's application
 */
export async function getApplication(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const application = await prisma.playerApplication.findUnique({
      where: { userId: req.userId },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
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
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    // Resolve preferred team IDs to human-readable names for the player view
    let preferredTeamNames: string[] = [];
    const rawPreferred = application.preferredTeamIds;
    let preferredIds: string[] = [];

    if (rawPreferred && typeof rawPreferred === 'string') {
      try {
        const parsed = JSON.parse(rawPreferred) as unknown;
        if (Array.isArray(parsed)) {
          preferredIds = parsed.filter((id): id is string => typeof id === 'string');
        }
      } catch {
        preferredIds = String(rawPreferred)
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }
    }

    if (preferredIds.length > 0) {
      const teams = await prisma.team.findMany({
        where: {
          OR: [
            { id: { in: preferredIds } },
            { teamId: { in: preferredIds } },
          ],
        },
        select: {
          id: true,
          teamId: true,
          name: true,
        },
      });

      const teamIdToName: Record<string, string> = {};
      teams.forEach((team) => {
        teamIdToName[team.id] = team.name;
        teamIdToName[team.teamId] = team.name;
      });

      preferredTeamNames = preferredIds
        .map((id) => teamIdToName[id] || null)
        .filter((name): name is string => Boolean(name));
    }

    const documents = await prisma.document.findMany({
      where: {
        ownerType: 'PLAYER_APPLICATION',
        ownerId: application.id,
      },
      select: {
        id: true,
        documentType: true,
        verificationStatus: true,
        createdAt: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
      },
    });

    res.json({
      success: true,
      data: { application: { ...application, documents, preferredTeamNames } },
    });
  } catch (error: any) {
    console.error('Get application error:', error);
    res.status(500).json({ success: false, message: 'Failed to get application', error: error.message });
  }
}

/**
 * Check if an Aadhaar number is already registered
 */
export async function checkAadhaar(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const rawNumber = (req.query.number as string | undefined) || (req.query.aadhaarNumber as string | undefined);
    const normalizeAadhaar = (value: unknown): string => String(value || '').replace(/\D/g, '');
    const aadhaarNormalized = normalizeAadhaar(rawNumber);

    if (!aadhaarNormalized) {
      res.status(400).json({ success: false, message: 'Aadhaar number is required' });
      return;
    }

    if (!/^\d{12}$/.test(aadhaarNormalized)) {
      res.status(400).json({ success: false, message: 'Invalid Aadhaar number (must be exactly 12 digits)' });
      return;
    }

    const existing = await prisma.playerApplication.findFirst({
      where: {
        aadhaarNumber: aadhaarNormalized,
        userId: { not: req.userId },
      },
      select: { id: true },
    });

    const alreadyRegistered = Boolean(existing);

    res.json({
      success: true,
      data: {
        aadhaarNumber: aadhaarNormalized,
        alreadyRegistered,
        available: !alreadyRegistered,
      },
    });
  } catch (error: any) {
    console.error('Check Aadhaar error:', error);
    res.status(500).json({ success: false, message: 'Failed to check Aadhaar number', error: error.message });
  }
}

/**
 * Submit application
 */
export async function submitApplication(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const application = await prisma.playerApplication.findUnique({
      where: { userId: req.userId },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found. Please create an application first.' });
      return;
    }

    if (application.status !== 'DRAFT') {
      res.status(400).json({ 
        success: false, 
        message: `Application already ${application.status.toLowerCase()}. Cannot resubmit.` 
      });
      return;
    }

    // Validate required fields
    if (!application.fullName || !application.dateOfBirth || !application.gender || 
        !application.playerPhone || !application.emergencyContactName || !application.emergencyContactPhone) {
      res.status(400).json({ 
        success: false, 
        message: 'Please complete all required fields before submitting' 
      });
      return;
    }

    if (!application.nationality) {
      res.status(400).json({ success: false, message: 'Please select nationality before submitting' });
      return;
    }

    if (!application.pincode || !/^\d{6}$/.test(application.pincode)) {
      res.status(400).json({ success: false, message: 'Please enter a valid 6-digit pincode before submitting' });
      return;
    }

    // Validate Aadhaar number
    const normalizeAadhaar = (value: unknown): string => String(value || '').replace(/\D/g, '');
    const aadhaarNormalized = normalizeAadhaar(application.aadhaarNumber);

    if (!aadhaarNormalized || !/^\d{12}$/.test(aadhaarNormalized)) {
      res.status(400).json({
        success: false,
        message: 'Please enter a valid 12-digit Aadhaar number before submitting',
      });
      return;
    }

    const aadhaarDuplicate = await prisma.playerApplication.findFirst({
      where: {
        aadhaarNumber: aadhaarNormalized,
        userId: { not: req.userId },
      },
      select: { id: true },
    });

    if (aadhaarDuplicate) {
      res.status(400).json({
        success: false,
        message: 'This Aadhaar number is already registered',
      });
      return;
    }

    // Validate preferred teams (must select at least one)
    const preferredTeamsRaw = application.preferredTeamIds;
    let preferredTeams: unknown = null;
    if (preferredTeamsRaw) {
      try {
        preferredTeams = JSON.parse(preferredTeamsRaw);
      } catch {
        preferredTeams = preferredTeamsRaw.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    if (!Array.isArray(preferredTeams) || preferredTeams.length === 0) {
      res.status(400).json({ success: false, message: 'Please select at least one preferred team before submitting' });
      return;
    }

    // Validate required documents: Identity proof must be uploaded
    const idProofCount = await prisma.document.count({
      where: {
        ownerType: 'PLAYER_APPLICATION',
        ownerId: application.id,
        documentType: 'ID_PROOF',
      },
    });
    if (idProofCount < 1) {
      res.status(400).json({ success: false, message: 'Identity proof (ID_PROOF) is required before submitting' });
      return;
    }

    // Validate required documents: Aadhaar card photo must be uploaded
    const aadhaarCardCount = await prisma.document.count({
      where: {
        ownerType: 'PLAYER_APPLICATION',
        ownerId: application.id,
        documentType: 'AADHAAR_CARD',
      },
    });
    if (aadhaarCardCount < 1) {
      res.status(400).json({ success: false, message: 'Aadhaar Card Photo is required before submitting' });
      return;
    }

    // Update status to SUBMITTED (immutable snapshot)
    const submittedApp = await prisma.playerApplication.update({
      where: { userId: req.userId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        trialStatus: 'PENDING', // Trial is mandatory
      },
    });

    // Create trial request
    const trial = await prisma.trial.create({
      data: {
        applicationId: submittedApp.id,
        status: 'PENDING',
      },
    });

    // Link trial to application
    await prisma.playerApplication.update({
      where: { id: submittedApp.id },
      data: { trialId: trial.id },
    });

    // Notify user
    await notifyApplicationStatus(req.userId, 'SUBMITTED');

    res.json({
      success: true,
      message: 'Application submitted successfully. Trial will be assigned soon.',
      data: { application: submittedApp, trialId: trial.id },
    });
  } catch (error: any) {
    console.error('Submit application error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application', error: error.message });
  }
}

/**
 * Check application status
 */
export async function getApplicationStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const application = await prisma.playerApplication.findUnique({
      where: { userId: req.userId },
      select: {
        id: true,
        status: true,
        trialStatus: true,
        submittedAt: true,
        reviewedAt: true,
        rejectionReason: true,
        resubmissionAttempts: true,
        trial: {
          select: {
            status: true,
            outcome: true,
            scheduledDate: true,
            assignedCoach: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found' });
      return;
    }

    const documents = await prisma.document.findMany({
      where: {
        ownerType: 'PLAYER_APPLICATION',
        ownerId: application.id,
      },
      select: {
        documentType: true,
        verificationStatus: true,
      },
    });

    res.json({
      success: true,
      data: { status: { ...application, documents } },
    });
  } catch (error: any) {
    console.error('Get application status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get status', error: error.message });
  }
}
