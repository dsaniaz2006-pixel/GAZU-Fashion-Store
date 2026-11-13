import {CATEGORIES,COLORS} from './catalogue.js';
export function sniffImage(bytes,mime){
 if(!Buffer.isBuffer(bytes)||bytes.length<12||bytes.length>3_000_000)throw new TypeError('Image must be JPEG, PNG, or WebP and no larger than 3 MB.');
 const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
 const actual=png?'image/png':jpg?'image/jpeg':webp?'image/webp':null;
 if(!actual||actual!==mime)throw new TypeError('The uploaded image format does not match its contents.');
 return actual;
}
export function sanitizeVisualGuess(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new TypeError('Invalid visual description.');
 const words=value=>String(value||'').replace(/[^a-zA-Z0-9 -]/g,' ').trim().slice(0,45);
 const category=CATEGORIES.includes(raw.category)?raw.category:null;
 const color=COLORS.includes(String(raw.color||'').toLowerCase())?String(raw.color).toLowerCase():'';
 const garment=words(raw.garment);const style=words(raw.style);
 return {category,color,garment,style,query:[color,garment,style].filter(Boolean).join(' ').slice(0,100)};
}
