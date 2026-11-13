import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import Product from "../../models/Product.js";
import AISizeChartDraft from "../../models/AISizeChartDraft.js";
import InventoryEvent from "../../models/InventoryEvent.js";
import { requireAuth, allowRoles } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { fail } from "../../utils/errors.js";
import { invalidateProducts } from "../../services/cache.js";
import { recommendFit, compareFits, verifiedChart } from "../../services/wave3/fit.js";
import { sourceSignature } from "../../services/wave3/admin.js";
import { publicRate, authRate, objectId, actualProduct, publishedProduct } from "./shared.js";

const router = Router();
const measurements=z.object({chestCm:z.number().min(45).max(200).optional(),waistCm:z.number().min(40).max(200).optional(),hipCm:z.number().min(45).max(210).optional(),fitPreference:z.enum(['slim','regular','oversized']).default('regular')}).strict();

// AGENT 1: publicly readable verified fitting chart. Measurements are ephemeral (never stored).
router.get('/fit/products',publicRate,async(_req,res)=>{
 const rows=await Product.find(actualProduct).select('name type category variants sizeGuide fitData img').limit(150).lean();
 res.set('Cache-Control','no-store').json({items:rows.map(p=>({id:String(p._id),name:p.name,category:p.category,hasVerifiedChart:!!verifiedChart(p)}))});
});
router.post('/fit/recommend',publicRate,validate(z.object({productId:objectId,...measurements.shape}).strict()),async(req,res)=>{
 const product=await publishedProduct(req.body.productId);
 res.set('Cache-Control','no-store').json({product:{id:String(product._id),name:product.name},...recommendFit(product,req.body)});
});
router.post('/fit/compare',publicRate,validate(z.object({firstId:objectId,secondId:objectId,...measurements.shape}).strict()),async(req,res)=>{
 if(req.body.firstId===req.body.secondId)fail(400,'Choose two different products.');
 const [a,b]=await Promise.all([publishedProduct(req.body.firstId),publishedProduct(req.body.secondId)]);
 res.set('Cache-Control','no-store').json(compareFits(a,b,req.body));
});
const measurePair={chestMinCm:z.number().min(20).max(220).optional(),chestMaxCm:z.number().min(20).max(220).optional(),waistMinCm:z.number().min(20).max(220).optional(),waistMaxCm:z.number().min(20).max(220).optional(),hipMinCm:z.number().min(20).max(230).optional(),hipMaxCm:z.number().min(20).max(230).optional()};
const sizeRow=z.object({size:z.string().trim().min(1).max(16),...measurePair}).strict().refine(r=>['chest','waist','hip'].some(k=>Number.isFinite(r[`${k}MinCm`])&&Number.isFinite(r[`${k}MaxCm`])&&r[`${k}MaxCm`]>=r[`${k}MinCm`]),{message:'At least one valid body measurement range is needed.'}).refine(r=>['chest','waist','hip'].every(k=>(r[`${k}MinCm`]===undefined&&r[`${k}MaxCm`]===undefined)||(r[`${k}MinCm`]!==undefined&&r[`${k}MaxCm`]!==undefined&&r[`${k}MaxCm`]>=r[`${k}MinCm`])),{message:'Provide both min and max for each measurement.'});
// Fit charts enter a review queue first. A separate administrator must approve them.
router.post('/fit/products/:id/chart-draft',requireAuth,allowRoles('admin','inventory_manager'),authRate,validate(z.object({source:z.string().trim().min(10).max(160),rows:z.array(sizeRow).min(1).max(25)}).strict()),async(req,res)=>{
 if(!objectId.safeParse(req.params.id).success)fail(400,'Invalid product ID.');
 const labels=req.body.rows.map(r=>r.size.toLowerCase());if(new Set(labels).size!==labels.length)fail(400,'Duplicate size labels.');
 const product=await Product.findOne({_id:req.params.id,active:true}).lean();if(!product)fail(404,'Product not found.');
 const draft=await AISizeChartDraft.create({product:product._id,createdBy:req.user.id,source:req.body.source,rows:req.body.rows,sourceSignature:sourceSignature(product)});
 res.status(201).json({id:draft.id,status:'pending',notice:'Chart not published. A separate administrator must verify the source and approve it.'});
});
router.get('/fit/chart-drafts',requireAuth,allowRoles('admin','inventory_manager'),authRate,async(req,res)=>res.json({items:await AISizeChartDraft.find({status:'pending'}).sort({createdAt:-1}).limit(50).populate('product','name category')}));
router.patch('/fit/chart-drafts/:id',requireAuth,allowRoles('admin'),authRate,validate(z.object({action:z.enum(['approve','reject'])}).strict()),async(req,res)=>{
 if(!objectId.safeParse(req.params.id).success)fail(400,'Invalid chart draft ID.');
 const result=await mongoose.connection.transaction(async session=>{
  const draft=await AISizeChartDraft.findOne({_id:req.params.id,status:'pending'}).session(session);
  if(!draft)fail(404,'Pending chart not found.');
  if(String(draft.createdBy)===String(req.user.id))fail(403,'A second administrator must independently review the measurement source.');
  const product=await Product.findOne({_id:draft.product,active:true}).session(session);if(!product)fail(404,'Product not found.');
  if(sourceSignature(product)!==draft.sourceSignature)fail(409,'Product has changed since this chart was proposed.');
  if(req.body.action==='approve'){
   const before=product.fitData||null;
   const updated=await Product.findOneAndUpdate({_id:product.id,active:true,updatedAt:product.updatedAt},{$set:{fitData:{source:draft.source,rows:draft.rows,verified:true,verifiedBy:req.user.id,measuredAt:new Date(),measurementType:'body',unit:'cm'}}},{new:true,runValidators:true,session});
   if(!updated)fail(409,'Product changed during review.');
   await InventoryEvent.create([{actor:req.user.id,product:product.id,action:'update',before:{fitData:before},after:{fitData:updated.fitData}}],{session});
  }
  const change=await AISizeChartDraft.updateOne({_id:draft.id,status:'pending'},{$set:{status:req.body.action==='approve'?'approved':'rejected',reviewedBy:req.user.id,reviewedAt:new Date()}},{session});
  if(change.modifiedCount!==1)fail(409,'Chart already reviewed.');
  return {id:draft.id,status:req.body.action==='approve'?'approved':'rejected'};
 });
 if(result.status==='approved')await invalidateProducts();res.json(result);
});

export default router;
