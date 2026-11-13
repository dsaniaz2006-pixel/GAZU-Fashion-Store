import Product from '../../models/Product.js';
import {fail} from '../../utils/errors.js';
export const ALLOWED_AI_TOOLS=Object.freeze(['find_products','get_product']);
export async function callReadOnlyAITool(name,args={}){
  if(!ALLOWED_AI_TOOLS.includes(name))fail(403,'AI tool not allowed');
  if(name==='find_products')return Product.search({q:String(args.q||'').slice(0,100),limit:Math.min(12,Math.max(1,Number(args.limit)||8))});
  if(!/^[0-9a-f]{24}$/i.test(String(args.id||'')))fail(400,'Invalid product id');
  return Product.findOne({_id:args.id,active:true,publicationStatus:'published'}).select('-aiEmbedding');
}
