import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { config } from '../config/env';

export interface TokenPayload {
  userId: string;
  role: string;
}

function getJwtExpiry(): SignOptions['expiresIn'] {
  const value = config.jwtExpiry;
  if (!value) return undefined;

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue) && value.trim() !== '') {
    return numericValue;
  }

  return value as SignOptions['expiresIn'];
}

/**
 * Generate JWT token
 */
export function generateToken(payload: TokenPayload): string {
  const secret: Secret = config.jwtSecret as Secret;
  const options: SignOptions = {
    expiresIn: getJwtExpiry(),
  };

  return jwt.sign(payload, secret, options);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
  } catch (error) {
    return null;
  }
}
