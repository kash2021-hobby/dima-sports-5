import admin from 'firebase-admin';
import { config } from '../config/env';
import { generateOTP } from '../utils/helpers';
import prisma from '../config/database';
import { sendSMS } from './twilio.service';

// Initialize Firebase Admin
if (config.firebaseProjectId && config.firebasePrivateKey && config.firebaseClientEmail) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebaseProjectId,
        privateKey: config.firebasePrivateKey,
        clientEmail: config.firebaseClientEmail,
      }),
    });
  } catch (error) {
    console.warn('Firebase Admin initialization failed. OTP will be logged to console.');
  }
}

/**
 * Send OTP via SMS (Twilio)
 */
export async function sendOTP(phone: string, otpCode: string): Promise<boolean> {
  try {
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    const message = `Your DHSA Sports verification code is ${otpCode}. It expires in ${config.otpExpiryMinutes} minutes.`;

    const success = await sendSMS(formattedPhone, message);

    if (!success) {
      console.error(`Failed to send OTP SMS to ${formattedPhone}`);
    }

    return success;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
}

/**
 * Generate and store OTP for existing user (by userId)
 */
export async function generateAndStoreOTP(userId: string, phone: string): Promise<string> {
  const otpCode = generateOTP(config.otpLength);
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + config.otpExpiryMinutes);

  await prisma.user.update({
    where: { id: userId },
    data: {
      otpCode,
      otpExpiresAt: expiresAt,
      otpVerified: false,
    },
  });

  // Send OTP
  await sendOTP(phone, otpCode);

  return otpCode;
}

/**
 * Verify OTP
 */
export async function verifyOTP(userId: string, otpCode: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { otpCode: true, otpExpiresAt: true, otpVerified: true },
  });

  if (!user || !user.otpCode || !user.otpExpiresAt) {
    return false;
  }

  // Check if already verified
  if (user.otpVerified) {
    return false; // OTP already used
  }

  // Check if expired
  if (new Date() > user.otpExpiresAt) {
    return false;
  }

  // Check if code matches
  if (user.otpCode !== otpCode) {
    return false;
  }

  // Mark as verified
  await prisma.user.update({
    where: { id: userId },
    data: { otpVerified: true },
  });

  return true;
}

/**
 * Clear OTP (after successful verification or expiry)
 */
export async function clearOTP(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      otpCode: null,
      otpExpiresAt: null,
    },
  });
}

/**
 * Create an OTP session for phone verification without storing the phone number in the database.
 * Returns a sessionId that the client must send back along with the OTP code.
 */
export async function createPhoneOtpSession(phone: string): Promise<string> {
  const otpCode = generateOTP(config.otpLength);
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + config.otpExpiryMinutes);

  const session = await prisma.otpSession.create({
    data: {
      otpCode,
      otpExpiresAt: expiresAt,
      verified: false,
    },
  });

  // Send OTP via SMS using the provided phone (not stored in DB)
  await sendOTP(phone, otpCode);

  return session.id;
}

/**
 * Verify an OTP session by sessionId and code.
 * Marks the session as verified and clears sensitive fields on success.
 */
export async function verifyPhoneOtpSession(sessionId: string, otpCode: string): Promise<boolean> {
  const session = await prisma.otpSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.verified || !session.otpExpiresAt) {
    return false;
  }

  // Check expiry
  if (new Date() > session.otpExpiresAt) {
    return false;
  }

  // Check code
  if (session.otpCode !== otpCode) {
    return false;
  }

  await prisma.otpSession.update({
    where: { id: sessionId },
    data: {
      verified: true,
      otpCode: null,
      otpExpiresAt: null,
    },
  });

  return true;
}
