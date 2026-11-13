// Fail-closed isolated Wave 3 preview. Only the backend receives staging DB credentials.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const staging=process.env.MONGODB_STAGING_URI;
if(!staging){console.error('SAFETY STOP: Set MONGODB_STAGING_URI in the private root .env.');process.exit(1);}
let db;try{db=decodeURIComponent(new URL(staging).pathname.slice(1));}catch{console.error('SAFETY STOP: Staging URI is not valid.');process.exit(1);}
if(db!=='gazu_ai_staging'||staging===process.env.MONGODB_URI){console.error('SAFETY STOP: Refusing non-staging or ambiguous connection.');process.exit(1);}
const safeEnv={...process.env,MONGODB_URI:staging,PORT:'8002',FRONTEND_PORT:'5174',CLIENT_ORIGIN:'http://localhost:5174',NODE_ENV:'development',GAZU_AI_VECTOR_ENABLED:'true',GAZU_AI_AUTO_INDEX:'false'};
const frontEnv={...process.env,FRONTEND_PORT:'5174',API_PROXY_TARGET:'http://127.0.0.1:8002',VITE_API_URL:'/api',NODE_ENV:'development'};
// Drop the original DB credentials and AI secrets from the frontend child environment.
for(const key of Object.keys(frontEnv)){if(/MONGO|GEMINI_API_KEY|JWT_SECRET|SMTP_|REDIS_|PAYMENT_/i.test(key))delete frontEnv[key];}
const children=[];
const stop=()=>{for(const child of children)if(child.exitCode===null)child.kill('SIGTERM');};
process.on('SIGINT',stop);process.on('SIGTERM',stop);
function start(name,prefix,env){const p=spawn('npm',['run','dev','--prefix',prefix],{cwd:root,env,stdio:'inherit'});children.push(p);p.on('exit',code=>{if(code){console.error(`${name} exited with ${code}.`);stop();process.exitCode=code;}});}
console.log('GAZU WAVE 3: staging ONLY (gazu_ai_staging)');
console.log('Frontend: http://localhost:5174 | Backend: http://localhost:8002/api/health');
console.log('Original GAZU database URL was not modified. Press Ctrl+C to stop.');
start('Backend','backend',safeEnv);start('Frontend','frontend',frontEnv);
