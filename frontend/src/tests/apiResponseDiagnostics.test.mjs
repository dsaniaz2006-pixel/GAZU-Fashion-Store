import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnosticApiError } from '../apiResponseDiagnostics.mjs';
test('identifies conflicting servers when reply is an unexplained failure',()=> {
 const result=diagnosticApiError({status:404,path:'/products?category=Men',message:'Request failed.'});
 assert.match(result,/port 8000/);
 assert.match(result,/HTTP 404/);
});
test('preserves meaningful API messages',()=> {
 assert.equal(diagnosticApiError({status:401,path:'/auth/me',message:'Unauthorized',isGazuApi:true}),'Unauthorized');
});
test('explains backend gateway failure',()=> {
 assert.match(diagnosticApiError({status:502,path:'/products',message:''}),/backend unavailable/);
});
test('provides status and path for generic GAZU errors',()=> {
 assert.match(diagnosticApiError({status:500,path:'/products',message:'',isGazuApi:true}),/HTTP 500.*\/products/);
});

test('preserves meaningful GAZU API 503 errors but diagnoses unknown proxy failures',()=> {
 assert.equal(diagnosticApiError({status:503,path:'/auth/register',message:'Email unavailable. Resend later.',isGazuApi:true}),'Email unavailable. Resend later.');
 assert.match(diagnosticApiError({status:503,path:'/auth/register',message:'Server error',isGazuApi:false}),/backend unavailable/);
});
