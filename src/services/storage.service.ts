import { Readable } from 'stream';
import { google } from 'googleapis';
import { config } from '../config/env';

const oauth2Client = new google.auth.OAuth2(
  config.googleDriveClientId,
  config.googleDriveClientSecret,
  config.googleDriveRedirectUri,
);

if (!config.googleDriveRefreshToken) {
  // eslint-disable-next-line no-console
  console.warn('GOOGLE_DRIVE_REFRESH_TOKEN is not set. Google Drive operations will fail.');
} else {
  oauth2Client.setCredentials({
    refresh_token: config.googleDriveRefreshToken,
  });
}

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const response = await drive.files.create({
    requestBody: {
      name: key,
      parents: config.googleDriveFolderId ? [config.googleDriveFolderId] : undefined,
      mimeType: contentType,
    },
    media: {
      mimeType: contentType,
      body: Readable.from(buffer),
    },
    fields: 'id',
  });

  if (!response.data.id) {
    throw new Error('Failed to upload file to Google Drive (missing file id)');
  }

  return response.data.id;
}

export async function getPresignedUrl(
  key: string,
  expiresIn = 300,
): Promise<string> {
  const baseUrl = config.appUrl.replace(/\/+$/, '');
  const encodedKey = encodeURIComponent(key);
  return `${baseUrl}/api/documents/files/${encodedKey}`;
}

export async function getDriveFileStream(
  fileId: string,
): Promise<NodeJS.ReadableStream> {
  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
    },
    { responseType: 'stream' },
  );

  return response.data as NodeJS.ReadableStream;
}


