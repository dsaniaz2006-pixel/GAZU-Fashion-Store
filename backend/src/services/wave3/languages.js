// Agent 3: same catalogue/search and authorization boundary across all languages.
export const LANGUAGES=Object.freeze({en:{name:'English',locale:'en-IN'},hi:{name:'Hindi / हिन्दी',locale:'hi-IN'},pa:{name:'Punjabi / ਪੰਜਾਬੀ',locale:'pa-IN'}});
export const validLanguage=lang=>Object.hasOwn(LANGUAGES,lang);
export const languageLabel=lang=>LANGUAGES[lang]?.name||LANGUAGES.en.name;
export const voiceLocale=lang=>LANGUAGES[lang]?.locale||LANGUAGES.en.locale;
const LEXICON=[[/शर्ट|कमीज़|कमीज़|ਕਮੀਜ਼|ਕਮੀਜ|shirt/iu,'shirt'],[/जूता|जूते|ਜੁੱਤ|जूती|sneaker/iu,'shoes'],[/काला|काली|काले|ਕਾਲਾ|ਕਾਲੀ/iu,'black'],[/सफेद|ਸਫ਼ੈਦ|ਚਿੱਟਾ|सफ़ेद/iu,'white'],[/जीन्स|ਜੀਨਸ/iu,'jeans'],[/जैकेट|ਜੈਕਟ/iu,'jacket'],[/ड्रेस|ਡਰੈੱਸ/iu,'dress'],[/नीला|नीली|ਨੀਲਾ|ਨੀਲੀ/iu,'blue'],[/पैंट|ਪੈਂਟ/iu,'trousers'],[/सूट|ਸੂਟ/iu,'suit']];
export function searchFallback(message='',lang='en'){let q=String(message||'').slice(0,160);if(lang==='en')return q;const tags=LEXICON.filter(([rx])=>rx.test(q)).map(([,word])=>word);return tags.length?tags.join(' '):q;}
export function boundedLanguageHistory(messages=[],limit=10){return (Array.isArray(messages)?messages:[]).slice(-limit).filter(m=>['user','assistant'].includes(m.role)).map(m=>({role:m.role,text:String(m.text||'').slice(0,600)}));}
