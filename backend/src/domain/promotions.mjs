// Integer paise only. Promo values are never trusted from checkout clients.
export function discountPaise(subtotal,promo){
 if(!Number.isSafeInteger(subtotal)||subtotal<0)throw new Error('Invalid subtotal');
 if(!promo)return 0;
 if(promo.kind==='percent'){
   if(!Number.isInteger(promo.value)||promo.value<1||promo.value>50)throw new Error('Invalid percentage');
   return Math.floor(subtotal*promo.value/100);
 }
 if(promo.kind==='fixed'){
   if(!Number.isSafeInteger(promo.value)||promo.value<1)throw new Error('Invalid fixed discount');
   return Math.min(subtotal,promo.value);
 }
 throw new Error('Invalid promotion kind');
}
export function totalWithDiscount(subtotal,promo,gift=0){
 const discount=discountPaise(subtotal,promo);
 const giftUsed=Math.min(subtotal-discount,Math.max(0,gift));
 const delivery=subtotal>=99900?0:9900;
 return {discountPaise:discount,giftUsedPaise:giftUsed,deliveryPaise:delivery,totalPaise:subtotal-discount-giftUsed+delivery};
}
