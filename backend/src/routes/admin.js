import {queueProductEmbedding} from '../services/ai/aiJobs.js';
import {Router} from 'express';
import {z} from 'zod';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import InventoryEvent from '../models/InventoryEvent.js';
import StoreEvent from '../models/StoreEvent.js';
import {cacheStatus} from '../services/cache.js';
import LoyaltyEntry from '../models/LoyaltyEntry.js';
import ReferralClaim from '../models/ReferralClaim.js';
import {earnedPoints} from '../domain/loyalty.mjs';
import {validateVariants} from '../domain/inventory.mjs';
import {requireAuth,requireAdmin,allowRoles} from '../middleware/auth.js';
import {validate,validateId,productSchema,id} from '../middleware/validate.js';
import {fail} from '../utils/errors.js';
import {invalidateProducts} from '../services/cache.js';
import {statistics} from '../services/stats.js';
const router=Router();router.use(requireAuth);
const inventory=allowRoles('admin','inventory_manager');
const fulfil=allowRoles('admin','order_manager');
router.get('/stats',requireAdmin,async(req,res)=>res.json(await statistics()));
router.get('/operations',requireAdmin,async(req,res)=>res.json({mongo:mongoose.connection.readyState===1?'up':'down',redis:cacheStatus(),smtpConfigured:!!(process.env.EMAIL_USER&&process.env.EMAIL_PASS),environment:process.env.NODE_ENV||'development'}));
router.get('/journey',requireAdmin,async(req,res)=>{const after=new Date(Date.now()-30*86400_000);const rows=await StoreEvent.aggregate([{$match:{createdAt:{$gte:after}}},{$group:{_id:'$type',count:{$sum:1}}},{$sort:{count:-1}}]);res.json({windowDays:30,events:rows})});
router.get('/products',inventory,async(req,res)=>res.json(await Product.find({active:true}).sort({createdAt:1})));
router.post('/products',inventory,validate(productSchema),async(req,res)=>{
 const values={...req.body};
 if(values.variants?.length)values.quantity=validateVariants(values.variants);
 const product=await Product.create(values);
 await InventoryEvent.create({actor:req.user.id,product:product.id,action:'create',after:{name:product.name,quantity:product.quantity,pricePaise:product.pricePaise}});
 await invalidateProducts();await queueProductEmbedding(product,req.user.id).catch(()=>{});res.status(201).json(product);
});
router.patch('/products/:id',inventory,validateId,validate(productSchema),async(req,res)=>{
 const product=await Product.findOne({_id:req.params.id,active:true});if(!product)fail(404,'Product not found.');
 const before={quantity:product.quantity,pricePaise:product.pricePaise,sku:product.sku};
 const values={...req.body};
 if(values.variants?.length)values.quantity=validateVariants(values.variants);
 else if(product.variants?.length && values.quantity!==product.quantity)fail(409,'Change size inventory using the variant editor.');
 Object.assign(product,values);await product.save();
 await InventoryEvent.create({actor:req.user.id,product:product.id,action:'update',before,after:{quantity:product.quantity,pricePaise:product.pricePaise,sku:product.sku}});
 await invalidateProducts();await queueProductEmbedding(product,req.user.id).catch(()=>{});res.json(product);
});
router.patch('/products/:id/variants',inventory,validateId,validate(z.object({variants:z.array(z.object({size:z.string().trim().min(1).max(16),quantity:z.number().int().min(0).max(100000)}).strict()).max(40)}).strict()),async(req,res)=>{
 const total=validateVariants(req.body.variants);
 const product=await Product.findOne({_id:req.params.id,active:true});if(!product)fail(404,'Product not found.');
 const before={quantity:product.quantity,variants:product.variants.map(x=>({size:x.size,quantity:x.quantity}))};
 product.variants=req.body.variants;product.quantity=total;product.inStock=total>0;await product.save();
 await InventoryEvent.create({actor:req.user.id,product:product.id,action:'variants',before,after:{quantity:total,variants:req.body.variants}});
 await invalidateProducts();await queueProductEmbedding(product,req.user.id).catch(()=>{});res.json(product);
});
router.patch('/products/:id/publication',requireAdmin,validateId,validate(z.object({status:z.enum(['draft','review','published'])}).strict()),async(req,res)=>{
 const product=await Product.findOne({_id:req.params.id,active:true});if(!product)fail(404,'Product not found');
 const before={publicationStatus:product.publicationStatus};product.publicationStatus=req.body.status;await product.save();
 await InventoryEvent.create({actor:req.user.id,product:product.id,action:'publication',before,after:{publicationStatus:req.body.status}});
 await invalidateProducts();await queueProductEmbedding(product,req.user.id).catch(()=>{});res.json(product);
});
router.delete('/products/:id',inventory,validateId,async(req,res)=>{
 const product=await Product.findOneAndUpdate({_id:req.params.id,active:true},{$set:{active:false}});
 if(!product)fail(404,'Product not found.');
 await InventoryEvent.create({actor:req.user.id,product:product.id,action:'archive',before:{active:true},after:{active:false}});
 await invalidateProducts();res.status(204).end();
});
router.get('/inventory-history',inventory,async(req,res)=>res.json(await InventoryEvent.find().sort({createdAt:-1}).limit(100).populate('actor','name email')));
router.get('/orders',fulfil,async(req,res)=>res.json(await Order.find().populate('user','name email').sort({createdAt:-1})));
router.patch('/orders/:id/status',fulfil,validateId,validate(z.object({status:z.enum(['preparing','out_for_delivery','delivered'])}).strict()),async(req,res)=>{
 const previous={preparing:'placed',out_for_delivery:'preparing',delivered:'out_for_delivery'}[req.body.status];
 const changes={status:req.body.status};
 if(req.body.status==='delivered') changes.paymentStatus={$cond:[{$eq:['$paymentMethod','cod']},'collected','$paymentStatus']};
 let order;
 await mongoose.connection.transaction(async(session)=>{
  order=await Order.findOneAndUpdate({_id:req.params.id,status:previous},[{$set:changes}],{new:true,session});
  if(!order)fail(409,'Order is missing or status change is not allowed. Refresh the list.');
  const points=earnedPoints(order);
  if(points>0){const [entry]=await LoyaltyEntry.create([{user:order.user,order:order._id,points}],{session});
    await User.updateOne({_id:order.user},{$inc:{loyaltyPoints:entry.points}},{session});}
  // A one-time referral credit is issued on the invitee's first delivered order.
  if(order.status==='delivered'){
    const prior=await Order.exists({user:order.user,status:'delivered',_id:{$ne:order._id}}).session(session);
    if(!prior){const claim=await ReferralClaim.findOneAndUpdate({invitee:order.user,status:'pending'},{$set:{status:'rewarded',rewardOrder:order._id}},{new:true,session});
    if(claim)await User.updateOne({_id:claim.inviter},{$inc:{loyaltyPoints:50}},{session});}
  }
 });
 res.json(order);
});
router.get('/staff',requireAdmin,async(req,res)=>res.json(await User.find({role:{$ne:'customer'}}).select('name email role disabled').sort({name:1})));
router.patch('/staff/:id/role',requireAdmin,validateId,validate(z.object({role:z.enum(['customer','inventory_manager','order_manager','support_agent','marketing_manager','admin'])}).strict()),async(req,res)=>{
 if(req.params.id===req.user.id&&req.body.role!=='admin')fail(409,'You cannot demote your own admin account.');
 const u=await User.findById(req.params.id);if(!u)fail(404,'Staff account not found.');
 if(req.body.role!=='customer'&&!u.emailVerified)fail(409,'Verify the staff email before assigning access.');
 u.role=req.body.role;u.sessionVersion=(u.sessionVersion||0)+1;await u.save();res.json({id:u.id,role:u.role});
});
export default router;
