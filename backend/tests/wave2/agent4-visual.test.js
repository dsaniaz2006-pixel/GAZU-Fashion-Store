import {test} from 'node:test';import assert from 'node:assert/strict';
import {sniffImage,sanitizeVisualGuess} from '../../src/services/wave2/visual.js';
const jpeg=Buffer.concat([Buffer.from([255,216,255,224]),Buffer.alloc(30)]);
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(20)]);
test('agent4 unit: validates actual uploaded bytes, not only extension',()=>{assert.equal(sniffImage(jpeg,'image/jpeg'),'image/jpeg');assert.equal(sniffImage(png,'image/png'),'image/png');});
test('agent4 unit: rejects spoofed and oversize images',()=>{assert.throws(()=>sniffImage(jpeg,'image/png'));assert.throws(()=>sniffImage(Buffer.alloc(16),'image/jpeg'));assert.throws(()=>sniffImage(Buffer.alloc(3000001),'image/png'));});
test('agent4 integration: Gemini description is sanitized into bounded catalogue search',()=>{const r=sanitizeVisualGuess({category:'Men',garment:'oversized t-shirt',color:'black',style:'streetwear'});assert.equal(r.query,'black oversized t-shirt streetwear');assert.equal(r.category,'Men');});
test('agent4 TDD security: malicious model output cannot pass untrusted instructions',()=>{const r=sanitizeVisualGuess({category:'Staff',color:'secret',garment:'<script>alert(1)</script>'.repeat(99)});assert.equal(r.category,null);assert.equal(r.color,'');assert.ok(r.query.length<=100);assert.doesNotMatch(r.query,/[<>]/);});
test('agent4 TDD regression: unknown garment returns no fake item identity',()=>{const r=sanitizeVisualGuess({garment:'',color:'',style:''});assert.equal(r.query,'');assert.throws(()=>sanitizeVisualGuess([]));});
