import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',
  
  // MPIN Security
  mpinMaxAttempts: parseInt(process.env.MPIN_MAX_ATTEMPTS || '5', 10),
  mpinLockoutMinutes: parseInt(process.env.MPIN_LOCKOUT_MINUTES || '30', 10),
  
  // OTP
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
  otpLength: parseInt(process.env.OTP_LENGTH || '6', 10),
  
  // Twilio (SMS)
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioFromNumber: process.env.TWILIO_FROM_NUMBER || '',
  
  // Firebase
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  
  // File Upload
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf').split(','),
  
  // App
  appName: process.env.APP_NAME || 'DHSA Sports Platform',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
};

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_FROM_NUMBER',
];

if (config.nodeEnv === 'production') {
  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  });
}
