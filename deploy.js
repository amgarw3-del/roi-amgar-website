const { execSync } = require('child_process');
try {
  console.log('Deploying to Vercel...');
  const out = execSync('npx vercel --prod --yes', { cwd: __dirname, encoding: 'utf8', timeout: 120000 });
  console.log(out);
} catch (e) {
  console.error(e.stdout || e.message);
}
