// Pure loyalty rules: points are granted only after delivery.
export function earnedPoints(order){
 if(order?.status!=='delivered') return 0;
 const paise=Number(order.totalPaise)||0;
 return Number.isSafeInteger(paise)&&paise>0?Math.floor(paise/10000):0; // 1 point per ₹100
}
