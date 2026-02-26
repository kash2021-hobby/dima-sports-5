import { Request, Response } from 'express';
import prisma from '../config/database';
import {
  generateAndStoreOTP,
  verifyOTP,
  clearOTP,
  createPhoneOtpSession,
  verifyPhoneOtpSession,
} from '../services/otp.service';
import { setMPIN, verifyMPIN, isMPINLocked, incrementMPINAttempts, resetMPINAttempts } from '../services/mpin.service';
import { generateToken } from '../services/jwt.service';
import { formatPhone, isValidPhone, isValidMPIN } from '../utils/helpers';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * User Signup (Phone + OTP)
 */
export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number is required' });
      return;
    }

    const formattedPhone = formatPhone(phone);
    
    if (!isValidPhone(formattedPhone)) {
      res.status(400).json({ success: false, message: 'Invalid phone number format' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    if (existingUser) {
      res.status(400).json({ success: false, message: 'Phone number already registered' });
      return;
    }

    // Create an OTP session without storing the phone number in the database.
    const sessionId = await createPhoneOtpSession(formattedPhone);

    res.status(201).json({
      success: true,
      message: 'OTP sent to your phone',
      data: { sessionId },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Failed to create account', error: error.message });
  }
}

/**
 * Verify OTP
 */
export async function verifyOTPCode(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId, otpCode, phone } = req.body;

    if (!sessionId || !otpCode || !phone) {
      res.status(400).json({
        success: false,
        message: 'SessionId, phone, and OTP code are required',
      });
      return;
    }

    const formattedPhone = formatPhone(phone);

    // Ensure this phone is not already registered
    const existingUser = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    if (existingUser) {
      res.status(400).json({ success: false, message: 'Phone number already registered' });
      return;
    }

    const isValid = await verifyPhoneOtpSession(sessionId, otpCode);

    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      return;
    }

    // Create the user only after successful OTP verification, storing the phone now.
    const user = await prisma.user.create({
      data: {
        phone: formattedPhone,
        role: 'USER',
        status: 'ACTIVE',
        otpVerified: true,
      },
    });

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: { verified: true, userId: user.id },
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP', error: error.message });
  }
}

/**
 * Setup MPIN
 */
export async function setupMPIN(req: Request, res: Response): Promise<void> {
  try {
    const { userId, mpin } = req.body;
    const authReq = req as AuthRequest;

    // If authenticated (via middleware), use authenticated user's ID (for profile MPIN setup)
    // Otherwise use userId from body (for initial setup)
    const targetUserId = authReq.userId || userId;

    if (!targetUserId) {
      res.status(400).json({ success: false, message: authReq.userId ? 'User ID not found in token' : 'UserId is required' });
      return;
    }

    if (!mpin) {
      res.status(400).json({ success: false, message: 'MPIN is required' });
      return;
    }

    if (!isValidMPIN(mpin)) {
      res.status(400).json({ success: false, message: 'MPIN must be 4-6 digits' });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { otpVerified: true, mpinHash: true, role: true, status: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // For regular users, OTP must be verified
    if (user.role === 'USER' && !user.otpVerified) {
      res.status(400).json({ success: false, message: 'Please verify OTP first' });
      return;
    }

    // For all users (including coaches/referees), OTP must be verified before MPIN setup,
    // and MPIN can only be set once via this flow.
    if (!user.otpVerified) {
      res.status(400).json({ success: false, message: 'Please verify OTP first' });
      return;
    }
    if (user.mpinHash) {
      res.status(400).json({ success: false, message: 'MPIN already set. Use update-mpin to change it.' });
      return;
    }

    // Set MPIN
    await setMPIN(targetUserId, mpin);

    // After MPIN setup, mark user as VERIFIED if they were in a pre-verification state
    await prisma.user.update({
      where: { id: targetUserId },
      data: { status: user.status === 'INVITED' ? 'VERIFIED' : user.status },
    });

    res.json({
      success: true,
      message: 'MPIN set successfully',
    });
  } catch (error: any) {
    console.error('MPIN setup error:', error);
    res.status(500).json({ success: false, message: 'Failed to set MPIN', error: error.message });
  }
}

/**
 * Coach: Initial login with phone + Coach ID (before MPIN setup)
 */
export async function coachInitialLogin(req: Request, res: Response): Promise<void> {
  try {
    const { phone, coachId } = req.body;

    if (!phone || !coachId) {
      res.status(400).json({ success: false, message: 'Phone and Coach ID are required' });
      return;
    }

    const formattedPhone = formatPhone(phone);

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone: formattedPhone },
      include: {
        coach: true,
      },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid phone or Coach ID' });
      return;
    }

    // Check if user is a coach
    if (user.role !== 'COACH') {
      res.status(403).json({ success: false, message: 'This login method is only for coaches' });
      return;
    }

    // Check if coach exists and Coach ID matches
    if (!user.coach || user.coach.coachId !== coachId) {
      res.status(401).json({ success: false, message: 'Invalid phone or Coach ID' });
      return;
    }

    // Check if account is blocked
    if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
      res.status(403).json({ success: false, message: 'Account is blocked or suspended' });
      return;
    }

    // Check if MPIN is already set - if yes, redirect to normal login
    if (user.mpinHash) {
      res.status(400).json({ 
        success: false, 
        message: 'MPIN already set. Please use phone and MPIN to login.',
        requiresMPIN: true 
      });
      return;
    }

    // Check if coach is in valid status for initial login
    if (user.status !== 'INVITED' && user.status !== 'VERIFIED') {
      res.status(400).json({ 
        success: false, 
        message: `Coach status is ${user.status}. Cannot proceed with initial login.` 
      });
      return;
    }

    // Generate temporary token for MPIN setup
    const token = generateToken({
      userId: user.id,
      role: user.role,
    });

    res.json({
      success: true,
      message: 'Please set your MPIN to complete login',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          status: user.status,
          coachId: user.coach.coachId,
        },
        requiresMPINSetup: true,
      },
    });
  } catch (error: any) {
    console.error('Coach initial login error:', error);
    res.status(500).json({ success: false, message: 'Failed to login', error: error.message });
  }
}

/**
 * Login with MPIN
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { phone, mpin } = req.body;

    if (!phone || !mpin) {
      res.status(400).json({ success: false, message: 'Phone and MPIN are required' });
      return;
    }

    const formattedPhone = formatPhone(phone);

    // Find user
    const user = await prisma.user.findUnique({
      where: { phone: formattedPhone },
      select: {
        id: true,
        phone: true,
        mpinHash: true,
        role: true,
        status: true,
        mpinLockedUntil: true,
      },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid phone or MPIN' });
      return;
    }

    // Check if account is blocked
    if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
      res.status(403).json({ success: false, message: 'Account is blocked or suspended' });
      return;
    }

    // Check if MPIN is set
    if (!user.mpinHash) {
      res.status(400).json({ success: false, message: 'MPIN not set. Please set MPIN first' });
      return;
    }

    // Check if MPIN is locked
    const isLocked = await isMPINLocked(user.id);
    if (isLocked) {
      res.status(423).json({ 
        success: false, 
        message: 'MPIN locked due to too many failed attempts. Please try again later.' 
      });
      return;
    }

    // Verify MPIN
    const isValid = await verifyMPIN(mpin, user.mpinHash);

    if (!isValid) {
      await incrementMPINAttempts(user.id);
      res.status(401).json({ success: false, message: 'Invalid phone or MPIN' });
      return;
    }

    // Reset attempts on successful login
    await resetMPINAttempts(user.id);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      role: user.role,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Failed to login', error: error.message });
  }
}

/**
 * Resend OTP
 */
export async function resendOTP(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ success: false, message: 'UserId is required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    await generateAndStoreOTP(userId, user.phone);

    res.json({
      success: true,
      message: 'OTP resent to your phone',
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP', error: error.message });
  }
}

/**
 * Update MPIN (requires authentication and current MPIN verification)
 */
export async function updateMPIN(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { currentMpin, newMpin } = req.body;

    if (!currentMpin || !newMpin) {
      res.status(400).json({ success: false, message: 'Current MPIN and new MPIN are required' });
      return;
    }

    if (!isValidMPIN(newMpin)) {
      res.status(400).json({ success: false, message: 'New MPIN must be 4-6 digits' });
      return;
    }

    // Get user with MPIN hash
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        mpinHash: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Check if MPIN is set
    if (!user.mpinHash) {
      res.status(400).json({ 
        success: false, 
        message: 'MPIN not set. Please use setup-mpin endpoint first.' 
      });
      return;
    }

    // Verify current MPIN
    const isValid = await verifyMPIN(currentMpin, user.mpinHash);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Current MPIN is incorrect' });
      return;
    }

    // Check if new MPIN is same as current
    const isSame = await verifyMPIN(newMpin, user.mpinHash);
    if (isSame) {
      res.status(400).json({ success: false, message: 'New MPIN must be different from current MPIN' });
      return;
    }

    // Update MPIN
    await setMPIN(req.userId, newMpin);

    res.json({
      success: true,
      message: 'MPIN updated successfully',
    });
  } catch (error: any) {
    console.error('Update MPIN error:', error);
    res.status(500).json({ success: false, message: 'Failed to update MPIN', error: error.message });
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        player: {
          select: {
            playerId: true,
            displayName: true,
            footballStatus: true,
          },
        },
        application: {
          select: {
            id: true,
            status: true,
            fullName: true,
            submittedAt: true,
            reviewedAt: true,
            trial: {
              select: {
                id: true,
                outcome: true,
                evaluatedAt: true,
                assignedCoach: {
                  select: {
                    id: true,
                    coachId: true,
                    displayName: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
        coach: {
          select: {
            id: true,
            coachId: true,
            displayName: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user', error: error.message });
  }
}
