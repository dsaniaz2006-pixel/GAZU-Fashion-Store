import {safeCatalog,publicProduct,styleScore,rankStable,itemId} from './catalogue.js';
export function recommendProducts(products,{style='minimal',wishlist=[],category,limit=8,semanticIds=[]}={}){
 if(!['heritage','minimal','street','active'].includes(style)|| (category&&!['Men','Women','Kids','Accessories'].includes(category))||!Number.isInteger(limit)||limit<1||limit>20)throw new TypeError('Invalid discovery preferences.');
 const saved=(wishlist||[]).map(String);const savedProducts=(products||[]).filter(p=>saved.includes(itemId(p)));
 const favoriteTypes=new Set(savedProducts.map(p=>p.type));const favoriteColors=new Set(savedProducts.map(p=>p.color));
 const available=safeCatalog(products,{category}).filter(p=>!saved.includes(itemId(p)));
 const similar=new Set((Array.isArray(semanticIds)?semanticIds:[]).map(String));
 const sorted=rankStable(available,p=>styleScore(p,{style})+(favoriteTypes.has(p.type)?7:0)+(favoriteColors.has(p.color)?4:0)+(similar.has(itemId(p))?10:0),limit);
 return {items:sorted.map(p=>({...publicProduct(p),reason:favoriteTypes.has(p.type)?'Similar to items you saved':favoriteColors.has(p.color)?'Matches a color you saved':`Fits your ${style} style preference`})),mode:similar.size?'semantic-personalized':savedProducts.length?'wishlist-and-style':'style-discovery',personalized:savedProducts.length>0};
}
