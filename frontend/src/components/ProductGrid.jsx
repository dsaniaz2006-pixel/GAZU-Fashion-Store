import React from "react";
import ProductCard from "./ProductCard.jsx";
export default function ProductGrid({ products, className = "shop-grid" }) {
  return (
    <div className={`product-grid ${className}`}>
      {products.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}
