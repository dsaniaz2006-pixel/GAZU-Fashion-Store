import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
// Avoid SSRF: never download arbitrary product URLs or follow remote links.
const root=fileURLToPath(new URL('../../../../frontend/public/',import.meta.url));
const extensions={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
export async function localProductImage(image){
 if(typeof image!=='string'|| !/^\/products\/men-(?:footwear|topwear|bottomwear|winterwear|accessories)\/[a-z0-9-]+\.(?:png|jpg|webp)$/.test(image))return null;
 const absolute=resolve(root,`.`+image);if(!absolute.startsWith(resolve(root)+sep))return null;
 const bytes=await readFile(absolute).catch(()=>null);if(!bytes||bytes.length>4_000_000)return null;
 const mimeType=extensions[extname(absolute).toLowerCase()];
 return mimeType?{inlineData:{mimeType,data:bytes.toString('base64')}}:null;
}
