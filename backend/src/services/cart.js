import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { fail } from '../utils/errors.js';
import { cartVariantKey, validateVariantSelection } from '../domain/variants.mjs';
export async function readCart(userId){
  const user=await User.findById(userId).populate('cart.product');
  return user.cart.map(item=>({productId:String(item.product?._id||''),quantity:item.quantity,size:item.size||'',product:item.product}));
}
export async function changeCart(userId,productId,quantity,mode,size=''){
  if(typeof size!=='string'||size.length>16) fail(400,'Invalid size.');
  await mongoose.connection.transaction(async session=>{
    const user=await User.findById(userId).session(session);
    if(!user) fail(404,'Account not found.');
    const key=cartVariantKey(productId,size);
    const existing=user.cart.find(item=>cartVariantKey(item.product,item.size||'')===key);
    if(mode==='remove') {user.cart=user.cart.filter(item=>cartVariantKey(item.product,item.size||'')!==key);}
    else {
      const product=await Product.findById(productId).session(session);
      if(!product?.active||product.tag==='PRICE PENDING') fail(409,'Product is unavailable.');
      const next=mode==='add'?(existing?.quantity||0)+quantity:quantity;
      if(mode==='set'&&!existing) fail(404,'Cart size variant not found.');
      try {validateVariantSelection(product,size,next);} catch(err){fail(409,err.message);}
      if(existing) existing.quantity=next;
      else user.cart.push({product:productId,quantity:next,size});
    }
    await user.save({session});
  });
  return readCart(userId);
}
