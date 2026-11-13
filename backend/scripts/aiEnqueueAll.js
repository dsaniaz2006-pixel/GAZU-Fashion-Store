// Preview first: npm run ai:enqueue:all; apply: npm run ai:enqueue:all -- --confirm --kind=embed
import '../src/config/env.js';
import {checkEnvironment} from '../src/config/env.js';
import {connectDatabase} from '../src/config/db.js';
import Product from '../src/models/Product.js';
import AIJob from '../src/models/AIJob.js';
import {enqueueAIJob} from '../src/services/ai/aiJobs.js';
import mongoose from 'mongoose';
const args=process.argv.slice(2);const confirm=args.includes('--confirm');
const kind=args.find(x=>x.startsWith('--kind='))?.split('=')[1]||'embed';
if(!['tag','embed'].includes(kind))throw Error('Use --kind=tag or --kind=embed');
const limitArg=args.find(x=>x.startsWith('--limit='))?.split('=')[1];
const limit=limitArg?Number(limitArg):500;
if(!Number.isSafeInteger(limit)||limit<1||limit>5000)throw Error('Use --limit=1..5000');
try{checkEnvironment();await connectDatabase(process.env.MONGODB_URI);
 const query={active:true,...(kind==='embed'?{publicationStatus:'published'}:{})};
 const products=await Product.find(query).select('_id name').limit(limit).lean();
 let queued=0,skipped=0;
 for(const p of products){const exists=await AIJob.exists({kind,product:p._id,state:{$in:['queued','running']}});
 if(exists){skipped++;continue;}
 if(confirm){await enqueueAIJob({kind,product:p._id});queued++;}
 }
 console.log(JSON.stringify({kind,preview:!confirm,candidates:products.length,queued,alreadyQueued:skipped,maxBatch:limit}));
}catch(e){console.error(e.message);process.exitCode=1;}finally{await mongoose.disconnect();}
