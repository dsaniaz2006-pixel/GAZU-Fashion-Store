// Development only: trusted mkcert certificates. No production TLS termination here.
import { spawn, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const staging = process.argv.includes('--staging');
const port = staging ? '8002' : '8000';
const frontendPort = staging ? '5174' : '5173';
const cert = resolve(root, 'certs/localhost.pem');
const key = resolve(root, 'certs/localhost-key.pem');
if (!existsSync(cert) || !existsSync(key)) {
  console.error('HTTPS certificates missing. On macOS: brew install mkcert && npm run https:setup');
  process.exit(1);
}
let ca;
try { ca = join(execFileSync('mkcert', ['-CAROOT'], {encoding:'utf8'}).trim(), 'rootCA.pem'); }
catch { console.error('mkcert is missing. Install it: brew install mkcert'); process.exit(1); }
if (!existsSync(ca)) { console.error('Local mkcert CA is missing. Run: npm run https:setup'); process.exit(1); }
let db;
if (staging) {
  db = process.env.MONGODB_STAGING_URI;
  try { if (!db || decodeURIComponent(new URL(db).pathname.slice(1)) !== 'gazu_ai_staging' || db === process.env.MONGODB_URI) throw Error(); }
  catch { console.error('SAFETY STOP: Valid, separate MONGODB_STAGING_URI with /gazu_ai_staging required.'); process.exit(1); }
}
const common = {
  ...process.env,
  NODE_ENV: 'development',
  GAZU_HTTPS_ENABLED: 'true',
  GAZU_TLS_CERT_FILE: cert,
  GAZU_TLS_KEY_FILE: key,
  NODE_EXTRA_CA_CERTS: ca,
  FRONTEND_PORT: frontendPort,
  CLIENT_ORIGIN: `https://localhost:${frontendPort}`,
};
const backendEnv = { ...common, PORT: port, ...(staging ? {MONGODB_URI:db, GAZU_AI_VECTOR_ENABLED:'true', GAZU_AI_AUTO_INDEX:'false'} : {}) };
const frontendEnv = { ...common, API_PROXY_TARGET:`https://localhost:${port}`, VITE_API_URL:'/api' };
for (const key of Object.keys(frontendEnv)) {
  if (/MONGO|GEMINI_API_KEY|JWT_SECRET|SMTP_|REDIS_|PAYMENT_|GOOGLE_CLIENT_SECRET/i.test(key)) delete frontendEnv[key];
}
const paymentEnv = {...process.env, NODE_ENV:'development', PAYMENT_SERVICE_HOST:'127.0.0.1'};
const children=[];
function start(label, prefix, action, env) {
  const child=spawn('npm',['run', action, '--prefix', prefix], {cwd:root,env,stdio:'inherit'});
  children.push(child);
  child.on('exit', (code) => { if (code && !stopping) { console.error(`${label} exited with code ${code}`); stop(); process.exitCode = code; } });
}
let stopping=false;
function stop() { if(stopping)return; stopping=true; for(const c of children) if(c.exitCode===null)c.kill('SIGTERM'); }
process.once('SIGINT',stop); process.once('SIGTERM',stop);
console.log(`GAZU ${staging?'STAGING ':''}HTTPS: https://localhost:${frontendPort} | API: https://localhost:${port}/api/health`);
console.log('Only localhost services are started. No production credentials or certificates are bundled.');
start('Backend','backend','dev',backendEnv);
start('Frontend','frontend','dev',frontendEnv);
if (!staging) start('Payments','payment-service','start',paymentEnv);
