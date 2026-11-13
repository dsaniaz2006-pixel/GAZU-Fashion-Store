import {createHash} from 'node:crypto';
import Promotion from '../models/Promotion.js';
import PromotionRedemption from '../models/PromotionRedemption.js';
import GiftCredit from '../models/GiftCredit.js';
import GiftCreditUse from '../models/GiftCreditUse.js';
import {discountPaise,totalWithDiscount} from '../domain/promotions.mjs';
import {fail} from '../utils/errors.js';
export const giftHash=code=>createHash('sha256').update(String(code).trim().toUpperCase()).digest('hex');
function activeFilter(code){const now=new Date();return {code:String(code).trim().toUpperCase(),active:true,startAt:{$lte:now},endAt:{$gt:now}}}
export async function calculateOffer({userId,subtotal,couponCode='',giftCardCode='',session=null}){
 let promo=null,card=null;let rawPromo=null;
 if(couponCode){
   promo=await Promotion.findOne(activeFilter(couponCode)).session(session);
   if(!promo||subtotal<promo.minimumPaise||promo.redeemedCount>=promo.maxRedemptions)fail(409,'Promotion is unavailable or minimum order not met.');
   if(await PromotionRedemption.exists({promotion:promo._id,user:userId}).session(session))fail(409,'Promotion already used by this account.');
   rawPromo={kind:promo.kind,value:promo.value};
 }
 const beforeGift=totalWithDiscount(subtotal,rawPromo,0);
 if(giftCardCode){
   card=await GiftCredit.findOne({codeHash:giftHash(giftCardCode),active:true,$or:[{expiresAt:{$exists:false}},{expiresAt:{$gt:new Date()}}]}).select('+codeHash').session(session);
   if(!card||card.balancePaise<=0)fail(409,'Gift credit is unavailable or exhausted.');
 }
 const totals=totalWithDiscount(subtotal,rawPromo,card?Math.min(card.balancePaise,subtotal-beforeGift.discountPaise):0);
 return {...totals,promo,card};
}
export async function commitOffer({offer,userId,orderId,session}){
 if(offer.promo){
   const matched=await Promotion.updateOne({_id:offer.promo.id,redeemedCount:{$lt:offer.promo.maxRedemptions}},{$inc:{redeemedCount:1}},{session});
   if(matched.modifiedCount!==1)fail(409,'Promotion redemption limit reached.');
   await PromotionRedemption.create([{promotion:offer.promo.id,user:userId,order:orderId}],{session});
 }
 if(offer.card&&offer.giftUsedPaise>0){
   const matched=await GiftCredit.updateOne({_id:offer.card.id,balancePaise:{$gte:offer.giftUsedPaise}},{$inc:{balancePaise:-offer.giftUsedPaise}},{session});
   if(matched.modifiedCount!==1)fail(409,'Gift credit balance changed.');
   await GiftCreditUse.create([{card:offer.card.id,user:userId,order:orderId,amountPaise:offer.giftUsedPaise}],{session});
 }
}
