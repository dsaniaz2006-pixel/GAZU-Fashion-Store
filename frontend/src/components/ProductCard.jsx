import React, {useState} from "react";
import QuickView from "./QuickView.jsx";
import { Heart, ArrowUpRight, Plus } from "lucide-react";
import { useStorefront } from "../context/StorefrontContext.jsx";
import { image, money } from "../format.js";
export default function ProductCard({ p }) {
  const [quick,setQuick]=useState(false);
  const { ready, cartBusy, wishlist, addToCart, toggleWish, setSelected } =
    useStorefront();
  return (
    <article className="product-card">
      <button
        className="product-image"
        onClick={() => setSelected(p)}
        aria-label={`View ${p.name}`}
      >
        <img src={image(p.img, 700)} alt={p.name} loading="lazy" />
        {p.tag && <span className="tag">{p.tag}</span>}
        <span className="quick-view">
          QUICK VIEW <ArrowUpRight size={13} />
        </span>
      </button>
      <button
        className={`wish ${wishlist.some((x) => x.id === p.id) ? "active" : ""}`}
        onClick={() => toggleWish(p)}
        aria-label="Toggle wishlist"
      >
        <Heart
          size={17}
          fill={wishlist.some((x) => x.id === p.id) ? "currentColor" : "none"}
        />
      </button>
      <div className="product-info">
        <div>
          <h3>{p.name}</h3>
          <p>
            {p.color} · {p.category}
          </p>
          <p className="availability">
            {p.pricePending ? "PRICE TO BE CONFIRMED" : p.available
              ? `IN STOCK · ${p.quantity} available`
              : "OUT OF STOCK"}
          </p>
        </div>
        <div className="price">
          {p.pricePending ? "PRICE PENDING" : money(p.price)} {!p.pricePending && p.old && <del>{money(p.old)}</del>}
        </div>
      </div>
      <button type="button" className="gazu-phase-link" onClick={()=>setQuick(true)}>QUICK VIEW</button>
      {quick&&<QuickView product={p} onClose={()=>setQuick(false)}/>}
      <button
        className="add-small"
        disabled={!p.available || cartBusy || !ready}
        onClick={() => addToCart(p)}
      >
        {p.pricePending ? "PRICE PENDING" : p.available ? p.variants?.length ? "CHOOSE SIZE" : "ADD TO BAG" : "OUT OF STOCK"} <Plus size={13} />
      </button>
    </article>
  );
}
