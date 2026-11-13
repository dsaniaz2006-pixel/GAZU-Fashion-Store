/** Staging-only Wave 1 acceptance runner. Does not inspect or change the live storefront DB. */
import '../src/config/env.js';
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
import AIJob from '../src/models/AIJob.js';
import {createProvider} from '../src/services/ai/modelProvider.js';
import {smartProductSearch} from '../src/services/ai/smartSearch.js';
import {enqueueAIJob} from '../src/services/ai/aiJobs.js';

export function verifyStagingTarget(uri) {
  if (!uri) throw new Error('MONGODB_STAGING_URI is not configured.');
  let parsed;
  try {parsed=new URL(uri);} catch {throw new Error('Invalid MONGODB_STAGING_URI.');}
  if (!['mongodb+srv:', 'mongodb:'].includes(parsed.protocol) ||
      decodeURIComponent(parsed.pathname) !== '/gazu_ai_staging') {
    throw new Error('SAFETY STOP: staging URI must explicitly target /gazu_ai_staging.');
  }
  return uri;
}

async function main() {
  const command=process.argv[2] || 'status';
  if (!['status','semantic','queue-tags','worker'].includes(command)) {
    throw new Error('Usage: node scripts/aiStaging.js status|semantic|queue-tags|worker');
  }
  const uri=verifyStagingTarget(process.env.MONGODB_STAGING_URI);
  // Override ONLY inside this process. Never rewrite the root .env file.
  process.env.MONGODB_URI=uri;
  if (command==='semantic') process.env.GAZU_AI_VECTOR_ENABLED='true';
  await mongoose.connect(uri,{serverSelectionTimeoutMS:10000});
  if (mongoose.connection.name!=='gazu_ai_staging') {
    throw new Error('SAFETY STOP: actual MongoDB connection is not gazu_ai_staging.');
  }
  console.log('Connected database: gazu_ai_staging');
  if (command==='worker') {
    await mongoose.disconnect();
    await import('../src/workers/aiWorker.js');
    return;
  }
  const collection=mongoose.connection.db.collection('products');
  const total=await collection.countDocuments();
  const vectors=await collection.find({}, {projection:{name:1,'aiEmbedding.values':1}}).toArray();
  const embedded=vectors.filter(p=>p.aiEmbedding?.values?.length===768 && p.aiEmbedding.values.every(Number.isFinite)).length;
  const byState=await AIJob.aggregate([{$group:{_id:{kind:'$kind',state:'$state'},count:{$sum:1}}}]);
  console.log(JSON.stringify({products:total,valid768Embeddings:embedded,jobs:byState},null,2));
  if(command==='status'){
    if(total===0 || embedded===0)process.exitCode=1;
    return;
  }
  if(command==='queue-tags'){
    if(process.argv[3]!=='--confirm')throw new Error('Tagging creates jobs. Add --confirm to queue at most three jobs.');
    const candidates=await Product.find({active:true,publicationStatus:'published'}).select('_id').limit(3).lean();
    let queued=0;
    for(const p of candidates){
      const exists=await AIJob.exists({kind:'tag',product:p._id,state:{$in:['queued','running']}});
      if(!exists){await enqueueAIJob({kind:'tag',product:p._id});queued++;}
    }
    console.log(`Staging product-tagging jobs queued: ${queued}`);
    return;
  }
  const provider=createProvider();
  if(provider.name!=='gemini')throw new Error('Semantic test requires GAZU_AI_PROVIDER=gemini.');
  if(embedded===0)throw new Error('No valid embeddings are stored in staging.');
  const query='comfortable casual cotton t-shirt';
  const result=await smartProductSearch({q:query,page:1,limit:10},{provider});
  console.log(JSON.stringify({query,mode:result.mode,products:result.items.map(p=>({name:p.name,id:String(p._id)}))},null,2));
  if(result.mode!=='semantic'||result.items.length===0){
    throw new Error('SEMANTIC VERIFICATION FAILED: expected semantic mode and at least one result. Check Gemini/Atlas and product publication status.');
  }
  console.log('SEMANTIC VERIFICATION PASSED');
}

main().catch(error=>{console.error('Wave 1 staging check failed:',error.message);process.exitCode=1;}).finally(async()=>{if(mongoose.connection.readyState)await mongoose.disconnect();});
