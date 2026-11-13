import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {image,money} from '../../format.js';
export default function Wave2ProductCards({items=[],prefix='THE EDIT'}){
 if(!items.length)return <p className="gazu-wave2-muted">No in-stock products match right now. Try a different style or budget.</p>;
 return <div className="gazu-editorial-products gazu-wave2-results">{items.map((p,i)=>{
  const product=p.product||p;
  return <Link key={product._id||product.id||i} className="gazu-editorial-product" to={`/product/${product._id||product.id}`}>
   <div className="gazu-editorial-product-media"><img loading="lazy" alt={product.name} src={image(product.img,900)}/><span>{p.slot ? p.slot.toUpperCase() : prefix} / {String(i+1).padStart(2,'0')}</span></div>
   <div className="gazu-editorial-product-meta"><div><h3>{product.name}</h3><p>{money(product.pricePaise/100)}</p>{p.reason&&<small>{p.reason}</small>}</div><ArrowUpRight size={18} aria-hidden="true"/></div>
  </Link>;
 })}</div>;
}
