// Read-only: never changes the catalogue. Review findings before any cleanup.
const GROUPS = new Set(['Men','Women','Kids','Accessories']);
const IMAGE = /^(photo-[a-zA-Z0-9-]+|\/uploads\/[a-f0-9-]+\.(?:png|jpg|webp)|\/products\/men-(?:footwear|topwear|bottomwear|winterwear|accessories)\/[a-z0-9-]+\.webp)$/;
export function inspectCatalogue(products=[]) {
  const findings=[];const names=new Map(),skus=new Map();
  const issue=(p,code,message)=>findings.push({id:String(p._id||p.id||''),name:String(p.name||''),code,message});
  for(const p of products){
    const label=String(p.name||'').trim().toLowerCase().replace(/\s+/g,' ');
    if(!label)issue(p,'NAME_MISSING','Product name is missing');
    if(label){if(names.has(label))issue(p,'DUPLICATE_NAME',`Name repeats ${names.get(label)}`);else names.set(label,String(p._id||p.id||''));}
    const sku=String(p.sku||'').trim().toUpperCase();
    if(sku){if(skus.has(sku))issue(p,'DUPLICATE_SKU',`SKU repeats ${skus.get(sku)}`);else skus.set(sku,String(p._id||p.id||''));}
    if(!GROUPS.has(p.category))issue(p,'CATEGORY_INVALID','Expected Men, Women, Kids or Accessories');
    if(!String(p.type||'').trim())issue(p,'TYPE_MISSING','Missing subcategory');
    if(!IMAGE.test(String(p.img||'')))issue(p,'IMAGE_INVALID','Image path is not a supported local/approved source');
    if(!Number.isSafeInteger(p.pricePaise)||p.pricePaise<=0)issue(p,'PRICE_INVALID','Price must be a positive integer in paise');
    if(!Number.isSafeInteger(p.quantity)||p.quantity<0)issue(p,'QUANTITY_INVALID','Quantity must be a nonnegative integer');
    if((p.inStock===undefined?true:Boolean(p.inStock))!==(p.quantity>0))issue(p,'STOCK_MISMATCH','inStock disagrees with aggregate quantity');
    if(p.active===false)issue(p,'INACTIVE_PRODUCT','Archived/inactive product: confirm whether to retain');
    if(['draft','review'].includes(p.publicationStatus))issue(p,'UNPUBLISHED_PRODUCT','Product should not appear in customer search');
    if(String(p.tag||'').toUpperCase()==='PRICE PENDING')issue(p,'PRICE_PENDING','Product pricing has not been confirmed');
    if(/\b(demo|sample|placeholder)\b/i.test(String(p.name||'')))issue(p,'POSSIBLE_DEMO','Confirm whether product is intentionally a demo');
    if(!['published','review','draft',undefined].includes(p.publicationStatus))issue(p,'PUBLICATION_INVALID','Unexpected publication status');
    if(Array.isArray(p.variants)&&p.variants.length){
      const sizes=new Set();let total=0;
      for(const v of p.variants){const k=String(v.size||'').trim().toLowerCase();if(!k||sizes.has(k))issue(p,'VARIANT_SIZE_INVALID','Empty or repeated variant size');sizes.add(k);if(!Number.isSafeInteger(v.quantity)||v.quantity<0)issue(p,'VARIANT_QUANTITY_INVALID','Invalid variant quantity');else total+=v.quantity;}
      if(total!==p.quantity)issue(p,'VARIANT_TOTAL_MISMATCH',`Variant total ${total} differs from aggregate ${p.quantity}`);
    }
  }
  return {createdAt:new Date().toISOString(),scanned:products.length,mutated:false,findings,summary:{findings:findings.length,byCode:Object.fromEntries([...new Set(findings.map(x=>x.code))].sort().map(code=>[code,findings.filter(x=>x.code===code).length]))}};
}
