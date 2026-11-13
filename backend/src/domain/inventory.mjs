export function validateVariants(variants){
 if(!Array.isArray(variants)||variants.length>40)throw new Error('Invalid size variants.');
 const sizes=new Set();let total=0;
 for(const v of variants){if(!v||typeof v.size!=='string'||!v.size.trim()||!Number.isSafeInteger(v.quantity)||v.quantity<0)throw new Error('Invalid variant quantity.');
 const key=v.size.trim().toUpperCase();if(sizes.has(key))throw new Error('Duplicate size variant.');sizes.add(key);total+=v.quantity;}
 if(!Number.isSafeInteger(total))throw new Error('Inventory total overflow.');return total;
}
