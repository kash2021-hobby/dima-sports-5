import bcrypt from 'bcryptjs';
import { config } from '../config/env';
import prisma from '../config/database';
import { isValidMPIN } from '../utils/helpers';

/**
 * Hash MPIN
 */
export async function hashMPIN(mpin: string): Promise<string> {
  return bcrypt.hash(mpin, 10);
}

/**
 * Verify MPIN
 */
export async function verifyMPIN(mpin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(mpin, hash);
}

/**
 * Check if MPIN is locked
 */
export async function isMPINLocked(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mpinLockedUntil: true },
  });

  if (!user || !user.mpinLockedUntil) {
    return false;
  }

  if (new Date() > user.mpinLockedUntil) {
    // Lock expired, clear it
    await prisma.user.update({
      where: { id: userId },
      data: { mpinLockedUntil: null, mpinAttempts: 0 },
    });
    return false;
  }

  return true;
}

/**
 * Increment MPIN attempts and lock if exceeded
 */
export async function incrementMPINAttempts(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mpinAttempts: true },
  });

  if (!user) return;

  const newAttempts = (user.mpinAttempts || 0) + 1;

  if (newAttempts >= config.mpinMaxAttempts) {
    // Lock account
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + config.mpinLockoutMinutes);

    await prisma.user.update({
      where: { id: userId },
      data: {
        mpinAttempts: newAttempts,
        mpinLockedUntil: lockUntil,
      },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { mpinAttempts: newAttempts },
    });
  }
}

/**
 * Reset MPIN attempts (on successful login)
 */
export async function resetMPINAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      mpinAttempts: 0,
      mpinLockedUntil: null,
      lastLoginAt: new Date(),
    },
  });
}

/**
 * Set MPIN for user
 */
export async function setMPIN(userId: string, mpin: string): Promise<void> {
  if (!isValidMPIN(mpin)) {
    throw new Error('MPIN must be 4-6 digits');
  }

  const mpinHash = await hashMPIN(mpin);

  await prisma.user.update({
    where: { id: userId },
    data: { mpinHash },
  });
}

/**
 * Validate MPIN format
 */
export function validateMPINFormat(mpin: string): { valid: boolean; message?: string } {
  if (!mpin) {
    return { valid: false, message: 'MPIN is required' };
  }

  if (!isValidMPIN(mpin)) {
    return { valid: false, message: 'MPIN must be 4-6 digits' };
  }

  return { valid: true };
}
