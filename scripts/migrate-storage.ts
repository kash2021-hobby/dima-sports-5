import prisma from '../src/config/database';

async function main() {
  const documents = await prisma.document.findMany();

  const s3Backed = documents.filter((doc) => doc.fileUrl && !doc.fileUrl.startsWith('drive:'));

  console.log(`Found ${s3Backed.length} documents that may need migration to Google Drive.`);
  console.log('Example documents:');
  console.log(s3Backed.slice(0, 10));

  console.log(
    'Implement the actual copy logic here: download from existing storage, upload to Google Drive, update fileUrl, then delete old objects once verified.',
  );
}

main()
  .catch((err) => {
    console.error('Migration script failed:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

