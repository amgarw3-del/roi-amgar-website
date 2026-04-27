const { execSync } = require('child_process');
const TOKEN = process.env.VERCEL_TOKEN;
if (!TOKEN) { console.error('VERCEL_TOKEN env var missing'); process.exit(1); }
try {
  console.log('Deploying to Vercel...');
  const out = execSync(`npx vercel --prod --yes --token ${TOKEN}`, { cwd: __dirname, encoding: 'utf8', timeout: 180000 });
  console.log(out);
} catch (e) {
  console.error(e.stdout || e.message);
}
