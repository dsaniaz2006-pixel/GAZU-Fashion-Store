// Dependency-free rules used by cart, checkout and product UI.
export function cartVariantKey(productId,size='') {return `${String(productId)}::${String(size||'').trim().toUpperCase()}`;}
export function variantStock(product,size='') {
  if(!Array.isArray(product?.variants)||!product.variants.length) return Number(product?.quantity||0);
  const variant=product.variants.find(v=>v.size===size);
  return variant ? Number(variant.quantity) : 0;
}
export function validateVariantSelection(product,size='',quantity=1) {
  if(!Number.isSafeInteger(quantity)||quantity<1||quantity>99) throw new Error('Invalid quantity.');
  const variants=Array.isArray(product?.variants)?product.variants:[];
  if(!variants.length && size) throw new Error('Size selection is not offered for this product.');
  if(variants.length && !size) throw new Error('Choose a size before adding to bag.');
  if(variants.length && !variants.some(v=>v.size===size)) throw new Error('Selected size is not available.');
  if(variantStock(product,size)<quantity || product?.inStock===false) throw new Error('This size or quantity is not available.');
  return quantity;
}
