// Delete all non-admin / non-coach users and their player-related data
// WARNING: This is destructive. It runs against the DB in .env (currently dhsa_db_duplicate).

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('Starting cleanup of non-admin / non-coach users...');

  // 1) Delete documents related to players and player applications
  const deletedPlayerDocs = await prisma.document.deleteMany({
    where: {
      ownerType: { in: ['PLAYER', 'PLAYER_APPLICATION'] },
    },
  });
  console.log(`Deleted player-related documents: ${deletedPlayerDocs.count}`);

  // 2) Delete all users that are not ADMIN or COACH.
  //    Cascades will remove linked Player, PlayerApplication, Trial rows, etc.
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: {
        notIn: ['ADMIN', 'COACH'],
      },
    },
  });
  console.log(`Deleted non-admin / non-coach users: ${deletedUsers.count}`);

  console.log('Cleanup complete.');
}

main()
  .catch((err) => {
    console.error('Cleanup failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

