import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const folder=resolve(root, 'certs');
mkdirSync(folder,{recursive:true,mode:0o700});
try {
  execFileSync('mkcert', ['-install'], {stdio:'inherit'});
  execFileSync('mkcert', ['-cert-file',resolve(folder,'localhost.pem'),'-key-file',resolve(folder,'localhost-key.pem'),'localhost','127.0.0.1','::1'], {stdio:'inherit'});
  console.log('Local HTTPS certificates generated. Private keys remain in certs/ (gitignored).');
} catch(error) {
  console.error('Could not configure local TLS. On Mac: brew install mkcert, then npm run https:setup.');
  process.exitCode=1;
}
