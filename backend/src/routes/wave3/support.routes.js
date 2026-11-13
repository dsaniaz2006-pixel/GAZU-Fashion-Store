import { Router } from "express";
import { z } from "zod";
import Order from "../../models/Order.js";
import SupportTicket from "../../models/SupportTicket.js";
import { requireAuth, allowRoles } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { fail } from "../../utils/errors.js";
import { safePrompt } from "../../services/ai/modelProvider.js";
import { supportExplanation, classifySupportTicket, SUPPORT_POLICIES } from "../../services/wave3/support.js";
import { publicRate, authRate, objectId } from "./shared.js";

const router = Router();

// AGENT 2: order data is always ownership-scoped. Escalations are human-reviewed tickets.
router.get('/support/policies',publicRate,(_req,res)=>res.json({policies:SUPPORT_POLICIES,source:'GAZU storefront Help page',contactNotice:'In-app ticket is the available escalation channel. No refund or shipment updates are automated.'}));
router.post('/support/ask',requireAuth,authRate,validate(z.object({message:z.string().trim().min(3).max(600),orderId:objectId.optional()}).strict()),async(req,res)=>{
 if(!safePrompt(req.body.message))fail(400,'Please rephrase your request.');
 const order=req.body.orderId?await Order.findOne({_id:req.body.orderId,user:req.user.id}).lean():null;
 if(req.body.orderId&&!order)fail(404,'Order not found.');
 res.set('Cache-Control','private, no-store').json(supportExplanation(req.body.message,order));
});
router.get('/support/orders',requireAuth,authRate,async(req,res)=>{const rows=await Order.find({user:req.user.id}).sort({createdAt:-1}).limit(30).select('_id orderNumber status createdAt');res.set('Cache-Control','private, no-store').json({items:rows});});
router.post('/support/tickets',requireAuth,authRate,validate(z.object({message:z.string().trim().min(10).max(1200),orderId:objectId.optional()}).strict()),async(req,res)=>{
 if(!safePrompt(req.body.message))fail(400,'Please rephrase your request.');
 if(req.body.orderId&&!await Order.exists({_id:req.body.orderId,user:req.user.id}))fail(404,'Order not found.');
 const category=classifySupportTicket(req.body.message);
 const doc=await SupportTicket.create({user:req.user.id,order:req.body.orderId||undefined,category,subject:req.body.message.slice(0,100),messages:[{by:req.user.id,role:'customer',message:req.body.message}]});
 res.status(201).set('Cache-Control','private, no-store').json({id:doc.id,status:doc.status,category:doc.category});
});
router.get('/support/tickets',requireAuth,authRate,async(req,res)=>{const rows=await SupportTicket.find({user:req.user.id}).sort({createdAt:-1}).limit(25).select('-__v').lean();res.set('Cache-Control','private, no-store').json({items:rows});});
const supportStaff=allowRoles('admin','support_agent');
router.get('/support/staff/tickets',requireAuth,supportStaff,authRate,async(req,res)=>{const rows=await SupportTicket.find().sort({createdAt:-1}).limit(100).select('category subject status createdAt user order').lean();res.set('Cache-Control','private, no-store').json({items:rows});});
router.post('/support/staff/tickets/:id/reply-draft',requireAuth,supportStaff,authRate,async(req,res)=>{
 if(!objectId.safeParse(req.params.id).success)fail(400,'Invalid ticket ID.');
 const ticket=await SupportTicket.findById(req.params.id).lean();if(!ticket)fail(404,'Ticket not found.');
 const order=ticket.order?await Order.findOne({_id:ticket.order,user:ticket.user}).lean():null;
 const hint=supportExplanation(ticket.messages?.[0]?.message||ticket.subject,order);
 res.json({suggestedReply:`Hello, thank you for contacting GAZU. ${hint.answer} A support agent will review your case.`,reviewRequired:true,category:ticket.category});
});
router.patch('/support/staff/tickets/:id',requireAuth,supportStaff,authRate,validate(z.object({status:z.enum(['open','in_progress','resolved']),reply:z.string().trim().min(3).max(1200).optional()}).strict()),async(req,res)=>{
 if(!objectId.safeParse(req.params.id).success)fail(400,'Invalid ticket ID.');
 const ticket=await SupportTicket.findById(req.params.id);if(!ticket)fail(404,'Ticket not found.');
 if(req.body.reply)ticket.messages.push({by:req.user.id,role:'staff',message:req.body.reply});
 ticket.status=req.body.status;if(ticket.status==='resolved')ticket.closedBy=req.user.id;
 await ticket.save();res.json({id:ticket.id,status:ticket.status});
});

export default router;
