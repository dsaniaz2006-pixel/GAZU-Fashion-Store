const allowed=new Set(['product_view','search','cart_add','checkout_start','order_complete']);
export function sanitizeEvent(event){
 if(!event||!allowed.has(event.type))throw new Error('Unsupported analytics event.');
 const result={type:event.type};
 if(typeof event.productId==='string'&&/^[a-f0-9]{24}$/i.test(event.productId))result.productId=event.productId;
 // No free text, email, IP, device fingerprint or arbitrary custom payload.
 return result;
}
