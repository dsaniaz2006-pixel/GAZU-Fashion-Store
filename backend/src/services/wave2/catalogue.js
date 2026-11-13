// Wave 2 shared read-only catalogue boundary. Agents never manufacture product records.
export const STYLES = Object.freeze(['heritage', 'minimal', 'street', 'active']);
export const CATEGORIES = Object.freeze(['Men', 'Women', 'Kids', 'Accessories']);
export const OCCASIONS = Object.freeze(['everyday', 'work', 'weekend', 'evening', 'travel', 'sport']);
export const COLORS = Object.freeze(['black','white','beige','blue','navy','grey','gray','brown','red','green','pink','cream','olive','khaki','purple','orange']);
export const SAFE_PRODUCT_FIELDS = 'name description category type color tag img pricePaise quantity inStock active publicationStatus styleTags variants rating reviewCount';
export const itemId = p => String(p?._id || p?.id || '');
export const norm = x => String(x || '').toLowerCase().trim();
export const isSaleable = p => Boolean(p && p.active !== false && p.publicationStatus !== 'draft' && p.publicationStatus !== 'review' && p.inStock !== false && Number.isSafeInteger(p.pricePaise) && p.pricePaise > 0 && Number.isFinite(p.quantity) && p.quantity > 0 && p.tag !== 'PRICE PENDING');
export const safeCatalog = (products, {category, maxPricePaise} = {}) => (products || []).filter(p => isSaleable(p) && (!category || p.category === category) && (!maxPricePaise || p.pricePaise <= maxPricePaise));
export function publicProduct(p) {
  return {_id:itemId(p),name:String(p.name||''),description:String(p.description||'').slice(0,500),category:p.category,type:p.type,color:p.color,tag:p.tag,img:p.img,pricePaise:p.pricePaise,quantity:p.quantity,inStock:p.inStock!==false,styleTags:Array.isArray(p.styleTags)?p.styleTags.slice(0,12):[],variants:Array.isArray(p.variants)?p.variants.map(v=>({size:v.size,quantity:v.quantity})):[],rating:p.rating||0,reviewCount:p.reviewCount||0,active:true};
}
export function tokens(s) {return new Set(norm(s).match(/[a-z0-9]+/g)||[]);}
export function styleScore(p, {style='minimal',occasion='everyday',color='',category=''}={}){
  const text=norm([p.name,p.type,p.description,p.color,...(p.styleTags||[])].join(' '));
  const terms={heritage:['heritage','classic','formal','tailored','timeless','knit','leather','blazer'],minimal:['minimal','basic','solid','cotton','neutral','clean','essential','classic'],street:['street','oversized','graphic','baggy','cargo','denim','sneaker'],active:['active','sport','athletic','running','trainer','performance','track']}[style]||[];
  const occasions={everyday:['casual','cotton','everyday'],work:['formal','office','shirt','blazer'],weekend:['casual','relaxed','tee'],evening:['formal','smart','blazer'],travel:['comfortable','relaxed','lightweight'],sport:['sport','active','sneaker']}[occasion]||[];
  return terms.reduce((n,t)=>n+(text.includes(t)?4:0),0) + occasions.reduce((n,t)=>n+(text.includes(t)?2:0),0) +(color&&norm(p.color)===norm(color)?6:0)+(category&&p.category===category?3:0);
}
export function rankStable(items,score,limit=8){return [...items].map((p,i)=>({p,i,score:score(p)})).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,limit).map(x=>x.p);}
