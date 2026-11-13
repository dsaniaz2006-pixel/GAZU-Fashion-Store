import AIJob from '../../models/AIJob.js';
import Product from '../../models/Product.js';
import { generateProductDraft } from './productTagging.js';
import { embedProduct } from './embeddings.js';
import {reserveAIRequest,recordAIUsage} from './usageTracker.js';
// MongoDB stores jobs durably; worker process must run separately.
export async function enqueueAIJob({kind,product,actor}) {return AIJob.create({kind,product,actor});}
export async function queueProductEmbedding(product,actor){
 if(process.env.GAZU_AI_AUTO_INDEX!=='true'||!product?.active||product.publicationStatus!=='published')return null;
 const existing=await AIJob.findOne({kind:'embed',product:product._id,state:{$in:['queued','running']}});
 return existing||enqueueAIJob({kind:'embed',product:product._id,actor});
}
export async function runOneAIJob({provider}={}) {
  const now=new Date();const job=await AIJob.findOneAndUpdate({$or:[{state:'queued',runAfter:{$lte:now}},{state:'running',leaseUntil:{$lte:now}}],attempts:{$lt:4}},{$set:{state:'running',leaseUntil:new Date(Date.now()+120000)},$inc:{attempts:1}},{sort:{createdAt:1},new:true});
  if(!job)return null;
  try{
    const usage=provider?.name==='gemini'?await reserveAIRequest({actor:{id:job.actor||'ai-worker'},kind:job.kind,model:provider.name,maxInput:4000}):null;
    const product=await Product.findOne({_id:job.product,active:true});if(!product)throw Error('PRODUCT_NOT_FOUND');
    const result=job.kind==='tag'?await generateProductDraft(product,{provider,actor:job.actor}):await embedProduct(product,{provider});
    if(usage)await recordAIUsage(usage);
    await AIJob.updateOne({_id:job._id},{$set:{state:'done',result:{id:String(result._id||result.id||product.id)},errorCode:null},$unset:{leaseUntil:1}});
    return {id:job.id,state:'done'};
  }catch(e){const failed=job.attempts>=4;await AIJob.updateOne({_id:job._id},{$set:{state:failed?'failed':'queued',runAfter:new Date(Date.now()+Math.min(60000,1000*2**job.attempts)),errorCode:e?.status?'PROVIDER_ERROR':'JOB_FAILED'},$unset:{leaseUntil:1}});return {id:job.id,state:failed?'failed':'queued'};}
}
