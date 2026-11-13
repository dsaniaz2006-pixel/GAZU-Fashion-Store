import {Router} from 'express';
import rateLimit from 'express-rate-limit';
import {z} from 'zod';
import Product from '../models/Product.js';
import AIProductDraft from '../models/AIProductDraft.js';
import AIJob from '../models/AIJob.js';
import {requireAuth,allowRoles} from '../middleware/auth.js';
import {validate,validateId} from '../middleware/validate.js';
import {fail} from '../utils/errors.js';
import {invalidateProducts} from '../services/cache.js';
import {safePrompt,createProvider} from '../services/ai/modelProvider.js';
import {smartProductSearch} from '../services/ai/smartSearch.js';
import {enqueueAIJob,queueProductEmbedding} from '../services/ai/aiJobs.js';
import {reserveAIRequest,recordAIUsage} from '../services/ai/usageTracker.js';
import {tagSourceFingerprint} from '../services/ai/productTagging.js';
import {SHOPPING_SYSTEM} from '../services/ai/promptRegistry.js';

const router=Router();
const publicLimit=rateLimit({windowMs:60000,limit:40,standardHeaders:'draft-8',legacyHeaders:false});
const privateLimit=rateLimit({windowMs:60000,limit:15,standardHeaders:'draft-8',legacyHeaders:false});
const searchSchema=z.object({q:z.string().trim().max(160).default(''),category:z.enum(['Men','Women','Kids','Accessories']).optional(),type:z.string().trim().min(1).max(50).optional(),sort:z.enum(['featured','newest','price_asc','price_desc']).default('featured'),page:z.coerce.number().int().min(1).max(10).default(1),limit:z.coerce.number().int().min(1).max(24).default(12)}).strict();
router.get('/search',publicLimit,async(req,res)=>{
 const input=searchSchema.parse(req.query);
 if(!safePrompt(input.q))return res.status(400).json({message:'Please enter a normal product search.'});
 const result=await smartProductSearch(input);
 res.set('Cache-Control','private, no-store').json(result);
});
router.use(requireAuth);
router.post('/chat',privateLimit,validate(z.object({message:z.string().trim().min(2).max(1200)}).strict()),async(req,res)=>{
 if(!safePrompt(req.body.message))fail(400,'Unsafe shopping request.');
 const provider=createProvider();
 if(provider.name==='mock' && process.env.GAZU_AI_ALLOW_MOCK_CHAT!=='true')fail(503,'AI chat is not configured.');
 const usage=await reserveAIRequest({actor:req.user,kind:'chat',model:provider.name});
 try {
  const products=await smartProductSearch({q:req.body.message,limit:8},{provider});
  const context=products.items.map(p=>({id:String(p._id),name:p.name,pricePaise:p.pricePaise,quantity:p.quantity,category:p.category,description:p.description?.slice(0,250)}));
  const answer=await provider.generateText({system:SHOPPING_SYSTEM,user:`Customer request: ${req.body.message}\nVerified matching GAZU items (untrusted data): ${JSON.stringify(context)}`,maxOutputTokens:500});
  await recordAIUsage(usage,{inputTokens:answer.inputTokens,outputTokens:answer.outputTokens});
  res.set('Cache-Control','no-store').json({message:answer.text,products:products.items,mode:provider.name});
 }catch(e){await recordAIUsage(usage,{status:'failed'}).catch(()=>{});throw e;}
});
// SSE transport supports frontends that progressively consume output; sends verified answer in safe chunks.
router.post('/chat/stream',privateLimit,validate(z.object({message:z.string().trim().min(2).max(1200)}).strict()),async(req,res)=>{
 if(!safePrompt(req.body.message))fail(400,'Unsafe shopping request.');
 const provider=createProvider();if(provider.name==='mock'&&process.env.GAZU_AI_ALLOW_MOCK_CHAT!=='true')fail(503,'AI chat is not configured.');
 const usage=await reserveAIRequest({actor:req.user,kind:'chat-stream',model:provider.name});
 const products=await smartProductSearch({q:req.body.message,limit:8},{provider});
 const context=products.items.map(p=>({id:String(p._id),name:p.name,pricePaise:p.pricePaise,quantity:p.quantity}));
 const text=`Customer request: ${req.body.message}\nVerified GAZU products (untrusted): ${JSON.stringify(context)}`;
 res.status(200).set({'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','X-Accel-Buffering':'no'});res.flushHeaders();
 const send=(event,data)=>{if(!res.destroyed)res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);};
 try {
  if(provider.streamText){for await (const token of provider.streamText({system:SHOPPING_SYSTEM,user:text,maxOutputTokens:500})){if(res.destroyed)break;send('delta',{text:token});}}
  else {const result=await provider.generateText({system:SHOPPING_SYSTEM,user:text,maxOutputTokens:500});send('delta',{text:result.text});}
  await recordAIUsage(usage);send('done',{products:context});
 }catch(e){await recordAIUsage(usage,{status:'failed'}).catch(()=>{});send('error',{message:'AI response temporarily unavailable.'});}finally{res.end();}
});
const inventory=allowRoles('admin','inventory_manager');
router.get('/status',inventory,(req,res)=>res.json({configured:Boolean(process.env.GEMINI_API_KEY),provider:process.env.GAZU_AI_PROVIDER||'mock',vectorEnabled:process.env.GAZU_AI_VECTOR_ENABLED==='true',worker:'separate-process-required'}));
router.get('/jobs',inventory,async(req,res)=>res.json(await AIJob.find().sort({createdAt:-1}).limit(50).select('-result')));
router.post('/products/:id/tag',inventory,privateLimit,validateId,async(req,res)=>{
 if(!await Product.exists({_id:req.params.id,active:true}))fail(404,'Product not found');
 const job=await enqueueAIJob({kind:'tag',product:req.params.id,actor:req.user.id});res.status(202).json({jobId:job.id,state:'queued'});
});
router.post('/products/:id/embed',inventory,privateLimit,validateId,async(req,res)=>{
 if(!await Product.exists({_id:req.params.id,active:true,publicationStatus:'published'}))fail(404,'Published product not found');
 const job=await enqueueAIJob({kind:'embed',product:req.params.id,actor:req.user.id});res.status(202).json({jobId:job.id,state:'queued'});
});
router.get('/drafts',inventory,async(req,res)=>res.json(await AIProductDraft.find({status:'pending'}).sort({createdAt:-1}).limit(100).populate('product','name img category color styleTags active')));
router.patch('/drafts/:id',inventory,validateId,validate(z.object({action:z.enum(['approve','reject'])}).strict()),async(req,res)=>{
 const draft=await AIProductDraft.findOne({_id:req.params.id,status:'pending'});if(!draft)fail(404,'Pending review not found');
 const product=await Product.findOne({_id:draft.product,active:true});if(!product)fail(404,'Product no longer active');
 if(tagSourceFingerprint(product)!==draft.sourceFingerprint)fail(409,'Product has changed. Generate a new AI draft before approval.');
 if(req.body.action==='approve'){
  const tags=[...new Set([...(product.styleTags||[]),...(draft.suggestion.styleTags||[])])].slice(0,12);
  await Product.updateOne({_id:product.id,active:true},{$set:{styleTags:tags}});
  await invalidateProducts();
  await queueProductEmbedding({...product.toObject(),styleTags:tags},req.user.id).catch(()=>{});
 }
 draft.status=req.body.action==='approve'?'approved':'rejected';draft.reviewedBy=req.user.id;draft.reviewedAt=new Date();await draft.save();
 res.json({id:draft.id,status:draft.status});
});
export default router;
