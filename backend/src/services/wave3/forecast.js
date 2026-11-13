// Agent 5: transparent time-series baselines only. All outputs are read-only suggestions.
export function forecastDaily(series=[],{horizon=7,holdoutDays=7}={}){
 const data=series.filter(x=>Number.isFinite(x)&&x>=0);
 const good=data.length>=28 && data.filter(x=>x>0).length>=5;
 if(!good)return {method:'moving-average-7-day',reliability:'insufficient',forecastUnits:null,horizonDays:horizon,historyDays:data.length,reason:'At least 28 daily observations and 5 nonzero sales days are needed for a baseline.'};
 const train=data.slice(0,-holdoutDays);const observed=data.slice(-holdoutDays);
 if(train.length<14)return {method:'moving-average-7-day',reliability:'insufficient',forecastUnits:null,horizonDays:horizon,historyDays:data.length};
 const rolling=(arr)=>arr.slice(-7).reduce((a,b)=>a+b,0)/7;
 const preds=[];let current=[...train];for(const actual of observed){preds.push(rolling(current));current.push(actual);}
 const mae=preds.reduce((a,p,i)=>a+Math.abs(p-observed[i]),0)/observed.length;
 const avg=rolling(data);const forecastUnits=Math.round(avg*horizon*100)/100;
 const recent=data.slice(-14).reduce((a,b)=>a+b,0)/14;const prior=data.slice(-28,-14).reduce((a,b)=>a+b,0)/14;
 return {method:'moving-average-7-day',reliability:'baseline',forecastUnits,horizonDays:horizon,meanDailyUnits:Math.round(avg*100)/100,holdout:{days:holdoutDays,mae:Math.round(mae*100)/100},trend:recent>prior*1.2?'up':recent<prior*.8?'down':'steady',historyDays:data.length,warning:'Indicative estimate, not a guaranteed demand prediction; very small samples may be unreliable.'};
}
export function assessInventory(product,averageDaily){const qty=Number(product?.quantity||0);const daily=Math.max(0,Number(averageDaily)||0);const days=daily>0?Math.round(qty/daily*10)/10:null;const risk=qty===0?'out':days!==null&&days<=7?'high':days!==null&&days<=21?'moderate':'low';return {productId:String(product._id||product.id||''),name:product.name,stock:qty,risk,daysOfCover:days,suggestion:risk==='out'?'Review stock availability before replenishing':risk==='high'?'Review replenishment need with purchasing staff':'Monitor inventory',sizeNotes:(product.variants||[]).filter(v=>Number(v.quantity)<=2).slice(0,12).map(v=>({size:v.size,quantity:v.quantity})),actionTaken:false};}
export function orderDemand(orders,productIds,today=new Date(),days=56){const ids=new Set(productIds.map(String));const end=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate()));const first=new Date(end.getTime()-(days-1)*86400000);const result=Object.fromEntries([...ids].map(id=>[id,Array(days).fill(0)]));for(const order of orders){const date=new Date(order.createdAt);if(!Number.isFinite(date.getTime())||date<first||date>=new Date(end.getTime()+86400000))continue;const n=Math.floor((Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())-first.getTime())/86400000);for(const item of order.items||[]){const key=String(item.product);if(ids.has(key)&&Number.isSafeInteger(item.quantity)&&item.quantity>0)result[key][n]+=item.quantity;}}return result;}
export function seasonalMessage(historyDays){return historyDays<365?'Seasonality is not established: less than one complete year of comparable observations.':'Seasonal patterns still require cohort validation; this baseline does not model seasonality.';}
