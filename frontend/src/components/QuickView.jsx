import React, {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {ShoppingBag, X} from 'lucide-react';
import {money,image} from '../format.js';
import {useCart} from '../context/CartContext.jsx';
import {useAuth} from '../context/AuthContext.jsx';
export default function QuickView({product,onClose}) {
 const [size,setSize]=useState('');const [status,setStatus]=useState('');const [busy,setBusy]=useState(false);
 const cart=useCart();const auth=useAuth();
 useEffect(()=>{const listener=e=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener)},[onClose]);
 if(!product)return null;
 async function add(){setBusy(true);setStatus('');try{await cart.add(product,1,size);setStatus('Added to bag.')}catch(e){setStatus(e.message)}finally{setBusy(false)}}
 return <div className="gazu-qv-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="gazu-qv-dialog" role="dialog" aria-modal="true" aria-label={`Quick view: ${product.name}`}>
   <button type="button" className="gazu-qv-close" onClick={onClose} aria-label="Close quick view"><X/></button>
   <img src={image(product.img,650)} alt={product.name}/>
   <div><p className="eyebrow">GAZU / QUICK VIEW</p><h2>{product.name}</h2><p>{product.color} · {product.category}</p><strong>{product.pricePending?'Price pending':money(product.price)}</strong>
    {!!product.variants?.length&&<label>Size<select aria-label="Select size" value={size} onChange={e=>setSize(e.target.value)}><option value="">Choose size</option>{product.variants.map(v=><option key={v.size} disabled={v.quantity<=0}>{v.size}</option>)}</select></label>}
    <div className="gazu-phase-controls">{auth.user?<button type="button" className="btn dark" disabled={busy||!product.available||!!product.variants?.length&&!size} onClick={add}><ShoppingBag size={15}/> Add to bag</button>:<Link className="btn dark" to="/account" onClick={onClose}>Sign in to buy</Link>}<Link className="btn" to={`/product/${product.id}`} onClick={onClose}>Full details</Link></div>
    <p role="status" className="gazu-phase-feedback">{status}</p></div>
  </section></div>;
}