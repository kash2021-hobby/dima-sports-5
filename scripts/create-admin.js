/**
 * Script to create an admin account
 * 
 * Usage:
 *   node scripts/create-admin.js <phone> <mpin>
 * 
 * Example:
 *   node scripts/create-admin.js 9999999999 1234
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin(phone, mpin) {
  try {
    // Validate MPIN
    if (!/^\d{4,6}$/.test(mpin)) {
      console.error('❌ MPIN must be 4-6 digits');
      process.exit(1);
    }

    // Validate phone
    const cleanedPhone = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
      console.error('❌ Invalid phone number format');
      process.exit(1);
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { phone: cleanedPhone },
    });

    if (existing) {
      console.error(`❌ User with phone ${cleanedPhone} already exists`);
      process.exit(1);
    }

    // Hash MPIN
    const mpinHash = await bcrypt.hash(mpin, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        phone: cleanedPhone,
        role: 'ADMIN',
        status: 'ACTIVE',
        mpinHash,
        otpVerified: true, // Skip OTP for admin
      },
    });

    console.log('\n✅ Admin account created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📱 Phone: ${admin.phone}`);
    console.log(`🔑 Role: ${admin.role}`);
    console.log(`🆔 User ID: ${admin.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('You can now login with:');
    console.log(`  Phone: ${admin.phone}`);
    console.log(`  MPIN: ${mpin}\n`);

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get arguments
const phone = process.argv[2];
const mpin = process.argv[3];

if (!phone || !mpin) {
  console.error('Usage: node scripts/create-admin.js <phone> <mpin>');
  console.error('Example: node scripts/create-admin.js 9999999999 1234');
  process.exit(1);
}

createAdmin(phone, mpin);
