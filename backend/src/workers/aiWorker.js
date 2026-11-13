import '../config/env.js';
import {connectDatabase} from '../config/db.js';
import mongoose from 'mongoose';
import {createProvider} from '../services/ai/modelProvider.js';
import {runOneAIJob} from '../services/ai/aiJobs.js';
import {checkEnvironment} from '../config/env.js';
checkEnvironment();
await connectDatabase(process.env.MONGODB_URI);
const provider=createProvider();let running=true;
process.on('SIGINT',()=>{running=false;});process.on('SIGTERM',()=>{running=false;});
while(running){const job=await runOneAIJob({provider}).catch(()=>null);if(!job)await new Promise(resolve=>setTimeout(resolve,1500));}
await mongoose.disconnect();
