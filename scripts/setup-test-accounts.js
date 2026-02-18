/**
 * Setup Admin Test Account Script
 * Creates: Admin account only for testing
 * 
 * Note: Coach and User accounts should be created through frontend
 * 
 * Usage:
 *   node scripts/setup-test-accounts.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Admin test account credentials
const ADMIN_ACCOUNT = {
  phone: '9999999999',
  mpin: '1234',
  role: 'ADMIN',
};

async function createAdmin(phone, mpin, role) {
  const cleanedPhone = phone.replace(/\D/g, '');
  const mpinHash = await bcrypt.hash(mpin, 10);

  // Check if exists
  const existing = await prisma.user.findUnique({
    where: { phone: cleanedPhone },
  });

  if (existing) {
    // Update existing
    return await prisma.user.update({
      where: { phone: cleanedPhone },
      data: {
        role,
        status: 'ACTIVE',
        mpinHash,
        otpVerified: true,
      },
    });
  }

  // Create new
  return await prisma.user.create({
    data: {
      phone: cleanedPhone,
      role,
      status: 'ACTIVE',
      mpinHash,
      otpVerified: true,
    },
  });
}

async function setupAdminAccount() {
  try {
    console.log('\n🚀 Setting up admin test account...\n');

    // Create Admin
    console.log('📝 Creating Admin account...');
    const admin = await createAdmin(
      ADMIN_ACCOUNT.phone,
      ADMIN_ACCOUNT.mpin,
      ADMIN_ACCOUNT.role
    );
    console.log(`   ✅ Admin created: ${admin.phone}`);

    // Display credentials
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Admin Test Account Created Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 ADMIN TEST CREDENTIALS:\n');
    console.log('   Phone: 9999999999');
    console.log('   MPIN:  1234');
    console.log('   Role:  ADMIN\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 You can now login as admin with these credentials!\n');
    console.log('📝 Note: Create Coach and User accounts through frontend.\n');

  } catch (error) {
    console.error('❌ Error setting up admin account:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminAccount();
