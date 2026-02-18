import admin from 'firebase-admin';
import { config } from '../config/env';
import { generateOTP } from '../utils/helpers';
import prisma from '../config/database';

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
 * Send OTP via Firebase SMS
 */
export async function sendOTP(phone: string, otpCode: string): Promise<boolean> {
  try {
    // Format phone for Firebase (add country code if needed)
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    // Send SMS via Firebase
    if (admin.apps.length > 0) {
      // In production, use Firebase Cloud Messaging or Twilio integration
      // For now, we'll log it (you can integrate actual SMS service)
      console.log(`[OTP] Sending to ${formattedPhone}: ${otpCode}`);
      
      // TODO: Integrate actual SMS service (Twilio, AWS SNS, etc.)
      // await admin.messaging().send(...)
      
      return true;
    } else {
      // Fallback: Log OTP for local testing
      console.log(`[OTP - LOCAL TEST] Phone: ${phone}, Code: ${otpCode}`);
      return true;
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
}

/**
 * Generate and store OTP for user
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
