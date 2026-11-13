import Product from '../../models/Product.js';
import {INDEX_NAME} from './embeddings.js';
import {createProvider} from './modelProvider.js';
import {reserveAIRequest,recordAIUsage} from './usageTracker.js';
const CATEGORIES=[['Men',/\b(men|mens|man|male|gentleman)\b/i],['Women',/\b(women|womens|woman|female|ladies)\b/i],['Kids',/\b(kids|children|boys|girls|baby)\b/i]];
const COLORS=['black','white','beige','blue','navy','grey','gray','brown','red','green','pink','yellow','cream','olive','khaki','purple','orange'];
const STOP=new Set(['i','me','my','for','a','an','the','and','or','show','find','want','need','please','with','under','below','less','than','rs','inr','rupees','outfit','look','price','budget','of','to','from','in','on','at','men','mens','man','women','womens','woman','kids']);
const tokenize=q=>(String(q||'').toLowerCase().match(/[a-z0-9]+/g)||[]).filter(x=>!STOP.has(x)&&x.length>1);
export function parseShoppingIntent(input){
 const q=String(input||'').slice(0,160);
 const budget=q.match(/(?:under|below|less than|upto|up to|budget(?: of)?|within)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)(?:\s*(?:rs|rupees))?/i)||q.match(/(?:₹|rs\.?|inr)\s*([\d,]+)\s*(?:or less|max)/i);
 const maxPricePaise=budget?Math.min(Number(budget[1].replaceAll(',',''))*100,100_000_000):undefined;
 const category=CATEGORIES.find(([,pattern])=>pattern.test(q))?.[0];
 const color=COLORS.find(c=>new RegExp(`\\b${c}\\b`,'i').test(q));
 const terms=tokenize(q.replace(/(?:under|below|less than|upto|up to|budget(?: of)?|within)\s*(?:₹|rs\.?|inr)?\s*[\d,]+/ig,' ')).filter(x=>!/^\d+$/.test(x));
 return {category,color,maxPricePaise:Number.isFinite(maxPricePaise)&&maxPricePaise>0?maxPricePaise:undefined,searchTerms:[...new Set(terms)],query:q};
}
export function rankLexical(items,q){const words=tokenize(q);return [...items].map((item,i)=>{const name=String(item.name||'').toLowerCase(),color=String(item.color||'').toLowerCase(),other=[item.type,item.description,...(item.styleTags||[])].join(' ').toLowerCase();const score=words.reduce((n,w)=>n+(name.includes(w)?5:0)+(color.includes(w)?3:0)+(other.includes(w)?2:0),0);return{item,i,score};}).sort((a,b)=>b.score-a.score||a.i-b.i).map(x=>x.item);}
export function sortSearchItems(items,sort='featured'){
 const sorted=[...items];
 if(sort==='price_asc')return sorted.sort((a,b)=>a.pricePaise-b.pricePaise);
 if(sort==='price_desc')return sorted.sort((a,b)=>b.pricePaise-a.pricePaise);
 if(sort==='newest')return sorted.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
 return sorted;
}
const SAFE_FIELDS={name:1,description:1,category:1,type:1,color:1,tag:1,img:1,pricePaise:1,originalPricePaise:1,quantity:1,inStock:1,variants:1,sizeGuide:1,sku:1,publicationStatus:1,styleTags:1,active:1,createdAt:1,updatedAt:1,rating:1,reviewCount:1};
export async function smartProductSearch({q='',category,type,sort='featured',page=1,limit=12},{provider=createProvider()}={}){
 const intent=parseShoppingIntent(q);const chosenCategory=category||intent.category;
 if(!q.trim())return {...await Product.search({q:'',category:chosenCategory,type,sort,page,limit}),mode:'catalogue',intent};
 const filter={active:true,publicationStatus:'published',...(chosenCategory?{category:chosenCategory}:{}),...(type?{type}:{}),...(intent.maxPricePaise?{pricePaise:{$lte:intent.maxPricePaise}}:{})};
 const terms=intent.searchTerms;const searchTerm=terms.join(' ').slice(0,100);
 // Never make an AI provider call or create an index when the integration is not configured.
 if(provider.name==='gemini' && process.env.GAZU_AI_VECTOR_ENABLED==='true'){
  try {
   const budget=await reserveAIRequest({actor:{id:'public-semantic-search'},kind:'semantic-search',model:provider.name,maxInput:160,limitOverride:Number(process.env.GAZU_AI_PUBLIC_DAILY_REQUESTS||300)});
   let queryVector;
   try{queryVector=await provider.embedText({text:q,dimensions:768});await recordAIUsage(budget);}catch(error){await recordAIUsage(budget,{status:'failed'}).catch(()=>{});throw error;}
   const limitCandidates=Math.min(150,page*limit*3);
   const items=await Product.aggregate([{$vectorSearch:{index:INDEX_NAME,path:'aiEmbedding.values',queryVector,numCandidates:Math.max(100,limitCandidates*5),limit:limitCandidates,filter}},{$project:{...SAFE_FIELDS,score:{$meta:'vectorSearchScore'}}}]);
   const filtered=intent.color?items.filter(p=>String(p.color||'').toLowerCase().includes(intent.color)):items;
   const ranked=sortSearchItems(rankLexical(filtered,q),sort);
   return {items:ranked.slice((page-1)*limit,page*limit),total:ranked.length,page,limit,pages:Math.ceil(ranked.length/limit),mode:'semantic',intent,approximateTotal:true};
  }catch{ /* safe fallback: no false availability or accidental products */ }
 }
 // Keyword fallback: indexed text search, then controlled regex on a bounded subset.
 const textFilter={...filter,...(searchTerm?{$text:{$search:searchTerm}}:{})};
 let items=[];
 if(searchTerm){items=await Product.find(textFilter).select(SAFE_FIELDS).limit(150).lean().catch(()=>[]);}
 if(!items.length){const word=terms.find(x=>x.length>2);const regex=word?new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'):null;
  items=await Product.find({...filter,...(regex?{$or:[{name:regex},{description:regex},{color:regex},{styleTags:regex},{type:regex}]}:{})}).select(SAFE_FIELDS).limit(150).lean();}
 const filtered=intent.color?items.filter(p=>String(p.color||'').toLowerCase().includes(intent.color)):items;
 const ranked=sortSearchItems(rankLexical(filtered,q),sort);
 return {items:ranked.slice((page-1)*limit,page*limit),total:ranked.length,page,limit,pages:Math.ceil(ranked.length/limit),mode:'keyword-fallback',intent,approximateTotal:ranked.length>=150};
}
