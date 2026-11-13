import AIProductDraft from '../../models/AIProductDraft.js';
import {createHash} from 'node:crypto';
import {TAGGING_SYSTEM} from './promptRegistry.js';
import {validateProductDraft} from './responseValidator.js';
import {createProvider} from './modelProvider.js';
import {localProductImage} from './localImage.js';
export function tagSourceFingerprint(product){return createHash('sha256').update(JSON.stringify([product.name,product.description,product.category,product.type,product.color,product.img,product.styleTags||[]])).digest('hex');}
export async function generateProductDraft(product,{provider=createProvider(),actor}={}){
 const user=JSON.stringify({name:product.name,description:product.description,category:product.category,type:product.type,color:product.color,currentTags:product.styleTags||[]});
 const imagePart=await localProductImage(product.img);
 const raw=await provider.generateJSON({system:TAGGING_SYSTEM,user,imagePart,schema:'productTags'});
 const suggestion=validateProductDraft(raw);
 return AIProductDraft.create({product:product.id||product._id,actor,status:'pending',provider:provider.name,suggestion,sourceFingerprint:tagSourceFingerprint(product)});
}
