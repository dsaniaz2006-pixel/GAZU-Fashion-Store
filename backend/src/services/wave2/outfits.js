import {safeCatalog,publicProduct,styleScore,itemId,norm} from './catalogue.js';
export const SLOTS = Object.freeze(['top','bottom','outerwear','footwear','accessory']);
export function outfitSlot(p){
 const t=norm([p.name,p.type].join(' '));
 if(/\b(shoes?|sneakers?|loafers?|boots?|trainers?|sandals?|footwear)\b/.test(t))return 'footwear';
 if(/\b(watch|belt|wallet|bag|tote|cap|hat|sunglass|accessor)\w*/.test(t))return 'accessory';
 if(/\b(jacket|coat|blazer|cardigan|pullover|outerwear|winterwear|hoodie)\b/.test(t))return 'outerwear';
 if(/\b(jeans|pants?|trousers?|cargo|shorts|skirts?|bottomwear)\b/.test(t))return 'bottom';
 if(/\b(tees?|t-shirts?|shirts?|polo|topwear|top|dress|kurta)\b/.test(t))return 'top';
 return null;
}
export function buildOutfit(products,{style='minimal',category='Men',budgetRupees=10000,anchorId,suggestedIds=[]}={}){
 const budget=Number(budgetRupees);
 if(!['heritage','minimal','street','active'].includes(style)||!['Men','Women','Kids'].includes(category)||!Number.isSafeInteger(budget)||budget<300||budget>250000)throw new TypeError('Invalid outfit preferences.');
 const available=safeCatalog(products,{maxPricePaise:budget*100}).filter(p=>p.category===category||p.category==='Accessories');
 const anchor=anchorId?available.find(p=>itemId(p)===String(anchorId)):null;
 if(anchorId&&!anchor)throw new RangeError('Anchor product is unavailable.');
 const allowedSuggestions=Array.isArray(suggestedIds)?suggestedIds.slice(0,12).map(String):[];
 const used=new Set();let remaining=budget*100;let selections=[];
 if(anchor){const slot=outfitSlot(anchor);if(!slot)throw new RangeError('Anchor product cannot be assigned to an outfit.');selections.push({slot,product:publicProduct(anchor)});used.add(itemId(anchor));remaining-=anchor.pricePaise;}
 for(const slot of SLOTS){if(selections.some(s=>s.slot===slot))continue;
  const candidates=available.filter(p=>outfitSlot(p)===slot&&!used.has(itemId(p))&&p.pricePaise<=remaining);
  candidates.sort((a,b)=>{const ai=allowedSuggestions.indexOf(itemId(a)),bi=allowedSuggestions.indexOf(itemId(b));if(ai>=0||bi>=0){if(ai<0)return 1;if(bi<0)return -1;if(ai!==bi)return ai-bi;}return styleScore(b,{style})-styleScore(a,{style})||a.pricePaise-b.pricePaise||itemId(a).localeCompare(itemId(b));});
  if(candidates[0]){const p=candidates[0];selections.push({slot,product:publicProduct(p)});used.add(itemId(p));remaining-=p.pricePaise;}
 }
 selections.sort((a,b)=>SLOTS.indexOf(a.slot)-SLOTS.indexOf(b.slot));
 const missingSlots=SLOTS.filter(slot=>!selections.some(s=>s.slot===slot));
 return {style,category,budgetRupees:budget,mode:allowedSuggestions.length?'ai-assisted':'catalogue-curated',items:selections,totalPricePaise:budget*100-remaining,missingSlots,complete:missingSlots.length===0,disclaimer:'Outfit inspiration only. Choose size and verify availability on each product page.'};
}
