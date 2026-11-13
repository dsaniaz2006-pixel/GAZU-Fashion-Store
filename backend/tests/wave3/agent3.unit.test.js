import {test} from 'node:test';import assert from 'node:assert/strict';
import {languageLabel,searchFallback,validLanguage,voiceLocale} from '../../src/services/wave3/languages.js';
test('agent3 unit: English Hindi Punjabi are supported',()=>{assert.deepEqual(['en','hi','pa'].map(validLanguage),[true,true,true]);assert.equal(validLanguage('fr'),false);});
test('agent3 TDD: basic Hindi/Punjabi garment terms reach English catalogue search',()=>{assert.match(searchFallback('मुझे काली शर्ट चाहिए','hi'),/shirt/i);assert.match(searchFallback('ਮੈਨੂੰ ਕਾਲੀ ਕਮੀਜ਼ ਚਾਹੀਦੀ','pa'),/shirt/i);});
test('agent3 unit: voice locales and response labels',()=>{assert.equal(voiceLocale('pa'),'pa-IN');assert.match(languageLabel('hi'),/Hindi/);});
