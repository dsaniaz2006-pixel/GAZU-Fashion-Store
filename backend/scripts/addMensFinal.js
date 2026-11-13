#!/usr/bin/env node
// Additive MongoDB import for 12 Bottomwear, 15 Winterwear, 5 Accessories.
import '../src/config/env.js';
import mongoose from 'mongoose';
import {checkEnvironment} from '../src/config/env.js';
import {connectDatabase} from '../src/config/db.js';
import Product from '../src/models/Product.js';
import {connectCache,invalidateProducts,closeCache} from '../src/services/cache.js';
import {MENS_FINAL_PRODUCTS,MENS_FINAL_NAMES,planMensFinalImport} from './mensFinalCatalogue.js';
const args=process.argv.slice(2);
const value=(name)=>args.find(a=>a.startsWith(`${name}=`))?.slice(name.length+1);
const target=value('--target'),apply=args.includes('--apply');
const confirmation='ADD_MENS_FINAL';
if (args.includes('--help')){
  console.log(`Usage:
  npm run catalogue:mens-final -- --target=atlas
  npm run catalogue:mens-final -- --target=atlas --apply --confirm=${confirmation}
  docker compose exec api node scripts/addMensFinal.js --target=docker
  docker compose exec api node scripts/addMensFinal.js --target=docker --apply --confirm=${confirmation}`);
  process.exit(0);
}
if (!['atlas','docker'].includes(target)||args.some(a=>a!=='--apply'&&!a.startsWith('--target=')&&!a.startsWith('--confirm='))||(apply&&value('--confirm')!==confirmation)){
  console.error(`Choose --target=atlas or --target=docker; applying requires --apply --confirm=${confirmation}. No changes made.`);process.exit(1);
}
const uri=process.env.MONGODB_URI||'',mode=process.env.GAZU_DB_MODE||'';
if (target==='docker'&&(mode!=='docker-local'||!/^mongodb:\/\/mongo:27017\//.test(uri))){console.error('Docker target requires docker-local mode and MongoDB host mongo. No changes made.');process.exit(1);}
if (target==='atlas'&&(mode!=='atlas'||!/^mongodb(\+srv)?:\/\//.test(uri)||/^mongodb:\/\/(?:mongo|localhost|127\.0\.0\.1)(?::|\/)/.test(uri))){console.error('Atlas target requires GAZU_DB_MODE=atlas and a non-local MongoDB URI. No changes made.');process.exit(1);}
let code=0;
try{
  checkEnvironment();
  await connectDatabase(uri);
  console.log(`${apply?'APPLY':'PREVIEW'} — ${target}; database ${mongoose.connection.name}`);
  const existing=await Product.find({name:{$in:MENS_FINAL_NAMES}}).select('name active').lean();
  const plan=planMensFinalImport(existing);
  console.log(`New products in archive: ${MENS_FINAL_PRODUCTS.length} (12 Bottomwear, 15 Winterwear, 5 Accessories)`);
  console.log('Four corduroy products have prices missing in the screenshots. They are imported OUT OF STOCK with price pending and cannot be purchased.');
  console.log(`Already in database: ${plan.alreadyPresent.length}; to create: ${plan.toCreate.length}`);
  for(const p of plan.toCreate) console.log(`  + [${p.type}] ${p.name}${p.tag==='PRICE PENDING'?' (price pending; unavailable)':''}`);
  for(const p of plan.alreadyPresent) if(p.active===false) console.log(`  SKIP (archived; not reactivated): ${p.name}`);
  if(apply){
    for(const p of plan.toCreate){
      if(!(await Product.exists({name:p.name}))){await Product.create(p);console.log(`Created: ${p.name}`);}
    }
    await connectCache();await invalidateProducts();
    console.log('Finished. Previous collections, customers, carts and orders have not been overwritten.');
  }else console.log('Preview only: no database changes. Review the database and item list before --apply.');
}catch(e){console.error(`Import failed: ${e.message}`);code=1;}
finally{try{await closeCache();}catch{}try{await mongoose.disconnect();}catch{}process.exitCode=code;}
