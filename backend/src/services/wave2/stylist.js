import {safeCatalog,publicProduct,styleScore,rankStable,STYLES,OCCASIONS,CATEGORIES,COLORS} from './catalogue.js';
export function validateStyleProfile(input={}){
  const style=String(input.style||'minimal').toLowerCase();
  const occasion=String(input.occasion||'everyday').toLowerCase();
  const category=input.category||'Men';
  const color=String(input.color||'').toLowerCase();
  const budget=Number(input.budgetRupees ?? 5000);
  if(!STYLES.includes(style)||!OCCASIONS.includes(occasion)||!CATEGORIES.includes(category)|| (color&&!COLORS.includes(color)) || !Number.isSafeInteger(budget)||budget<300||budget>250000)throw new TypeError('Invalid style preferences or budget.');
  return {style,occasion,category,color,budgetRupees:budget};
}
export function createStyleEdit(products,input={}){
  const profile=validateStyleProfile(input);
  const available=safeCatalog(products,{category:profile.category,maxPricePaise:profile.budgetRupees*100});
  const sorted=rankStable(available,p=>styleScore(p,profile),8);
  return {profile,items:sorted.map(publicProduct),mode:'catalogue-curated',summary:sorted.length?`A ${profile.style} edit for ${profile.occasion} dressing, selected from currently available GAZU pieces.`:'No available pieces match your category and budget. Try widening your preferences.',total:sorted.length};
}
