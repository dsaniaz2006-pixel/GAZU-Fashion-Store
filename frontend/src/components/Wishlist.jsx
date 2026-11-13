import React from "react";
import { Heart } from "lucide-react";
import { useStorefront } from "../context/StorefrontContext.jsx";
import ProductCard from "./ProductCard.jsx";
export default function Wishlist() {
  const { wishlist, go } = useStorefront();
  return (
    <div className="page-wrap">
      <div className="page-title">
        <p className="eyebrow">KEEP THE GOOD ONES CLOSE</p>
        <h1>
          YOUR WISHLIST <span>({wishlist.length})</span>
        </h1>
      </div>
      {wishlist.length ? (
        <div className="product-grid shop-grid">
          {wishlist.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <Heart size={36} />
          <h2>NOTHING SAVED. YET.</h2>
          <p>Tap the heart on pieces you want to come back to.</p>
          <button className="btn dark" onClick={() => go("shop", "All")}>
            DISCOVER YOUR NEXT FAVOURITE
          </button>
        </div>
      )}
    </div>
  );
}
