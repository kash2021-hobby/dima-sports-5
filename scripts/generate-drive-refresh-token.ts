import { google } from 'googleapis';

async function main() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || '';
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || '';

  if (!clientId || !clientSecret || !redirectUri) {
    console.error('Please set GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, and GOOGLE_DRIVE_REDIRECT_URI before running this script.');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    prompt: 'consent',
  });

  console.log('Visit this URL to authorize access to your Google Drive:');
  console.log(authUrl);
  console.log('\nAfter approving, paste the ?code= value here and press Enter.');

  process.stdout.write('Code: ');

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (chunk) => {
    const code = chunk.toString().trim();
    if (!code) {
      console.error('No code provided.');
      process.exit(1);
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      console.log('\nTokens received:');
      console.log(JSON.stringify(tokens, null, 2));
      if (tokens.refresh_token) {
        console.log('\nSave this value as GOOGLE_DRIVE_REFRESH_TOKEN in your environment:');
        console.log(tokens.refresh_token);
      } else {
        console.warn('No refresh_token was returned. Make sure access_type=offline and prompt=consent are set, and that you have not already granted consent for this client/user combination.');
      }
    } catch (err) {
      console.error('Failed to exchange code for tokens:', err);
    } finally {
      process.exit(0);
    }
  });
}

main().catch((err) => {
  console.error('Error in generate-drive-refresh-token script:', err);
  process.exit(1);
});

