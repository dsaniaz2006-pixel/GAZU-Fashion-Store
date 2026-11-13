import { Router } from "express";
import { z } from "zod";
import Product from "../../models/Product.js";
import Order from "../../models/Order.js";
import { requireAuth } from "../../middleware/auth.js";
import { forecastDaily, assessInventory, orderDemand, seasonalMessage } from "../../services/wave3/forecast.js";
import { authRate, inventoryStaff } from "./shared.js";

const router = Router();

// AGENT 5: no purchasing, stock or prices change. Only order line aggregates leave this route.
router.get('/admin/forecast',requireAuth,inventoryStaff,authRate,async(req,res)=>{
 const options=z.object({days:z.coerce.number().int().min(28).max(90).default(56),horizon:z.coerce.number().int().min(1).max(30).default(7)}).strict().parse(req.query);
 const start=new Date(Date.now()-(options.days+1)*86400000);
 const [products,orders]=await Promise.all([Product.find({active:true}).select('_id name quantity category variants').limit(300).lean(),Order.find({createdAt:{$gte:start}}).select('createdAt status items').sort({createdAt:-1}).limit(5000).lean()]);
 const series=orderDemand(orders,products.map(x=>String(x._id)),new Date(),options.days);
 const items=products.map(p=>{const forecast=forecastDaily(series[String(p._id)]||[],{horizon:options.horizon});return {productId:String(p._id),category:p.category,name:p.name,forecast,inventory:assessInventory(p,forecast.meanDailyUnits||0),trendExplanation:forecast.reliability==='insufficient'?'Not enough observations for a defensible trend statement.':`Recent order-intent trend: ${forecast.trend}. Based on creation dates, not verified delivery or payment.`};});
 res.set('Cache-Control','private, no-store').json({days:options.days,horizonDays:options.horizon,method:'7-day rolling-average demand by order creation date',ordersSampled:orders.length,ordersCapped:orders.length===5000,seasonality:seasonalMessage(options.days),items,actionTaken:false,disclaimer:'Historical ordering is not necessarily realized sales. The holdout MAE reports forecast error where data suffice. Do not auto-purchase or change stock.'});
});

export default router;
