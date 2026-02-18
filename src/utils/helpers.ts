import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a short player ID (e.g., PLR-9F3A)
 */
export function generatePlayerId(): string {
  const prefix = 'PLR';
  const random = uuidv4().substring(0, 4).toUpperCase();
  return `${prefix}-${random}`;
}

/**
 * Generate a short coach ID (e.g., COA-9F3A)
 */
export function generateCoachId(): string {
  const prefix = 'COA';
  const random = uuidv4().substring(0, 4).toUpperCase();
  return `${prefix}-${random}`;
}

/**
 * Generate a short team ID (e.g., TEAM-9F3A)
 */
export function generateTeamId(): string {
  const prefix = 'TEAM';
  const random = uuidv4().substring(0, 4).toUpperCase();
  return `${prefix}-${random}`;
}

/**
 * Generate a unique invite token for coach invite links
 */
export function generateInviteToken(): string {
  return uuidv4().replace(/-/g, '').substring(0, 32);
}

/**
 * Generate OTP code
 */
export function generateOTP(length: number = 6): string {
  return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: Date): boolean {
  return date < new Date();
}

/**
 * Check if date is in the future
 */
export function isFutureDate(date: Date): boolean {
  return date > new Date();
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Validate date of birth (must be in the past and within a reasonable age range)
 */
export function validateDateOfBirth(dateOfBirth: Date): boolean {
  if (Number.isNaN(dateOfBirth.getTime())) {
    return false;
  }

  if (!isPastDate(dateOfBirth)) {
    return false;
  }

  const age = calculateAge(dateOfBirth);
  return age >= 5 && age <= 100;
}

/**
 * Format phone number (remove spaces, dashes, and country code)
 * Handles Indian numbers: strips +91 or 91 prefix to get 10-digit number
 */
export function formatPhone(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove Indian country code (+91 or 91) if present
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  
  return cleaned;
}

/**
 * Validate phone number (Indian format)
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = formatPhone(phone);
  return /^[6-9]\d{9}$/.test(cleaned); // 10 digits starting with 6-9
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Check if MPIN is valid (4-6 digits)
 */
export function isValidMPIN(mpin: string): boolean {
  return /^\d{4,6}$/.test(mpin);
}
