import http from 'http';
import { exec } from 'child_process';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET env vars');
  process.exit(1);
}
const REDIRECT_URI = 'http://localhost:4999';
const PROPERTY_ID = '536541799';
const SERVICE_ACCOUNT_EMAIL = 'ga4-reader@sigaliot-donor.iam.gserviceaccount.com';
const SCOPE = 'https://www.googleapis.com/auth/analytics.manage.users';

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPE)}` +
  `&access_type=offline` +
  `&prompt=consent`;

console.log('\n=== GA4 Viewer Access Setup ===\n');
console.log('Opening browser for Google authentication...');
console.log('URL:', authUrl, '\n');

exec(`start "" "${authUrl}"`);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:4999`);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<h1>Error: ${error}</h1>`);
    console.error('OAuth error:', error);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400);
    res.end('No code');
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h1>✅ Authenticated! Check the terminal.</h1><p>You can close this tab.</p>');

  console.log('Got authorization code. Exchanging for token...');

  // Exchange code for token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokens.access_token) {
    console.error('\n❌ Token exchange failed:', JSON.stringify(tokens, null, 2));
    server.close();
    process.exit(1);
  }

  console.log('✅ Got access token.\n');
  console.log('Adding service account as Viewer to GA4 property...');

  // Try v1beta accessBindings first (newer API)
  const apiRes = await fetch(
    `https://analyticsadmin.googleapis.com/v1beta/properties/${PROPERTY_ID}/accessBindings`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: SERVICE_ACCOUNT_EMAIL,
        roles: ['predefinedRoles/viewer'],
      }),
    }
  );

  const result = await apiRes.json();

  if (apiRes.ok) {
    console.log('\n✅ SUCCESS! Service account added as Viewer:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\nGA4 dashboard should now show real data after a few minutes.');
  } else {
    console.error('\n❌ API error:', JSON.stringify(result, null, 2));

    // Try legacy userLinks API
    console.log('\nTrying legacy userLinks API...');
    const legacyRes = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/properties/${PROPERTY_ID}/userLinks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailAddress: SERVICE_ACCOUNT_EMAIL,
          directRoles: ['predefinedRoles/viewer'],
        }),
      }
    );
    const legacyResult = await legacyRes.json();
    if (legacyRes.ok) {
      console.log('\n✅ SUCCESS via userLinks:');
      console.log(JSON.stringify(legacyResult, null, 2));
    } else {
      console.error('\n❌ Legacy API also failed:', JSON.stringify(legacyResult, null, 2));
    }
  }

  server.close();
  process.exit(0);
});

server.listen(4999, () => {
  console.log('Waiting for OAuth callback on http://localhost:4999 ...\n');
});
