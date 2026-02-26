import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/env';

const s3Client = new S3Client({
  forcePathStyle: true,
  region: config.bucketRegion,
  endpoint: config.bucketEndpoint,
  credentials: {
    accessKeyId: config.bucketAccessKeyId,
    secretAccessKey: config.bucketSecretAccessKey,
  },
});

export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return key;
}

export async function getPresignedUrl(
  key: string,
  expiresIn = 300,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}


