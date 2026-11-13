import{Router}from'express';import rateLimit from'express-rate-limit';import{sanitizeEvent}from'../domain/events.mjs';import StoreEvent from'../models/StoreEvent.js';
const router=Router();router.use(rateLimit({windowMs:60_000,limit:50,standardHeaders:'draft-7',legacyHeaders:false}));
router.post('/',async(req,res)=>{const event=sanitizeEvent(req.body);await StoreEvent.create(event);res.status(202).json({accepted:true});});export default router;
