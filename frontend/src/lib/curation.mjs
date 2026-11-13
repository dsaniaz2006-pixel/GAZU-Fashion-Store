// Curated suggestions are deterministic and only use real products returned by the API.
const specs=[['Topwear',/shirt|polo|sweater|tee|t-shirt/i],['Bottomwear',/trousers|chinos|jeans|pants/i],['Footwear',/loafer|shoes|sneakers|boots/i],['Accessories',/belt|wallet|watch|sunglasses/i]];
export function curateLook(products){
 const chosen=[];
 for(const [,pattern] of specs){
   const pick=products.find(p=>p.available!==false&&!p.pricePending&&pattern.test(p.name||'')&&!chosen.some(c=>c.id===p.id));
   if(pick)chosen.push(pick);
 }
 return chosen;
}
export function styleQuizResults(products,style){
 const terms={heritage:/polo|oxford|chino|loafers|knit|coat|blazer|belt/i, minimal:/shirt|trousers|white|black|cream|beige|sneakers/i, street:/oversized|cargo|hoodie|baggy|sneakers|graphic/i, active:/running|training|sport|jogger|track/i};
 const pattern=terms[style]||terms.heritage;
 return products.filter(p=>p.available!==false&&!p.pricePending&&pattern.test(`${p.name} ${p.type} ${p.color}`)).slice(0,8);
}
