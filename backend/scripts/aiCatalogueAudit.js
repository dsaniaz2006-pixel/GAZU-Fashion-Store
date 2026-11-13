// Run from project root: npm run ai:audit [-- --database]
import '../src/config/env.js';
import {connectDatabase} from '../src/config/db.js';
import {inspectCatalogue} from '../src/services/ai/catalogueAudit.js';
import Product from '../src/models/Product.js';
import mongoose from 'mongoose';
import {access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DEMO_PRODUCTS} from './threeProductCatalogue.js';
import {FOOTWEAR_PRODUCTS} from './footwearCatalogue.js';
import {MENS_CLOTHING_PRODUCTS} from './mensClothingCatalogue.js';
const args=process.argv.slice(2);const live=args.includes('--database');
try {let products=[...DEMO_PRODUCTS,...FOOTWEAR_PRODUCTS,...MENS_CLOTHING_PRODUCTS];
 if(live){if(process.env.GAZU_AI_AUDIT_ALLOW_DATABASE!=='true')throw Error('Set GAZU_AI_AUDIT_ALLOW_DATABASE=true to enable read-only DB audit');await connectDatabase(process.env.MONGODB_URI);products=await Product.find().lean();}
 const report=inspectCatalogue(products);
 const publicRoot=fileURLToPath(new URL('../../frontend/public/',import.meta.url));
 for(const p of products){if(typeof p.img==='string'&&p.img.startsWith('/products/')){
  const path=resolve(publicRoot,`.${p.img}`);
  try{await access(path);}catch{report.findings.push({id:String(p._id||''),name:p.name,code:'IMAGE_FILE_MISSING',message:`Image missing: ${p.img}`});}
 }}
 report.summary.findings=report.findings.length;
 report.summary.byCode=Object.fromEntries([...new Set(report.findings.map(x=>x.code))].sort().map(code=>[code,report.findings.filter(x=>x.code===code).length]));
 console.log(JSON.stringify({...report,source:live?'connected-database':'bundled-catalogue'},null,2));process.exitCode=report.findings.length?2:0;
} catch(error){console.error(error.message);process.exitCode=1;}finally{await mongoose.disconnect();}
