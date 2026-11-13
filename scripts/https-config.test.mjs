import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { allowedBrowserOrigins } from '../backend/src/config/allowedOrigins.js';
import { getRuntimeConfig } from '../backend/src/config/runtime.js';
const read=(p)=>readFileSync(new URL('../'+p, import.meta.url),'utf8');
test('HTTPS development origin is allowed without re-enabling HTTP by default',()=>{
 const origins=allowedBrowserOrigins({NODE_ENV:'development',GAZU_HTTPS_ENABLED:'true',CLIENT_ORIGIN:'https://localhost:5173',FRONTEND_PORT:'5173'});
 assert.equal(origins.has('https://localhost:5173'),true);
 assert.equal(origins.has('http://localhost:5173'),false);
});
test('HTTPS staging origin is separate',()=>{
 const origins=allowedBrowserOrigins({NODE_ENV:'development',GAZU_HTTPS_ENABLED:'true',CLIENT_ORIGIN:'https://localhost:5174',FRONTEND_PORT:'5174'});
 assert.equal(origins.has('https://localhost:5174'),true);
 assert.equal(origins.has('https://localhost:5173'),false);
});
test('HTTP compatibility remains available for existing tests',()=>{
 assert.equal(allowedBrowserOrigins({NODE_ENV:'development',CLIENT_ORIGIN:'http://localhost:5173',FRONTEND_PORT:'5173'}).has('http://localhost:5173'),true);
});
test('TLS private key and certificate directory are ignored',()=>{
 const ignore=read('.gitignore');
 assert.match(ignore, /^certs\/$/m);
 assert.match(ignore,/\*\.pem/);
});
test('backend HTTPS path uses native TLS server, no password or cert checked into source',()=>{
 const source=read('backend/src/server.js');
 assert.match(source,/createHttpsServer/);
 assert.match(source,/GAZU_TLS_KEY_FILE/);
 assert.match(source,/GAZU_TLS_CERT_FILE/);
});
test('frontend HTTPS and secure proxy are wired',()=>{
 const source=read('frontend/vite.config.js');
 assert.match(source,/https,/);
 assert.match(source,/https:\/\/localhost:8000/);
 assert.doesNotMatch(source,/secure:\s*false/);
});
test('Google login CSRF cookie becomes secure in HTTPS mode',()=>{
 assert.match(read('backend/src/services/googleIdentity.js'),/GAZU_HTTPS_ENABLED === "true"/);
});
test('mock payment localhost binding is enforced by HTTPS launcher',()=>{
 assert.match(read('scripts/launchHttps.mjs'),/PAYMENT_SERVICE_HOST:'127\.0\.0\.1'/);
 assert.match(read('payment-service/src/server.js'),/PAYMENT_SERVICE_HOST/);
});
test('runtime ports remain unchanged',()=>{
 assert.equal(getRuntimeConfig({PORT:'8000'}).port,8000);
 assert.equal(getRuntimeConfig({PORT:'8002'}).port,8002);
});
