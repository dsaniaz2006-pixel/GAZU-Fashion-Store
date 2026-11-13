// Pure database-to-view-model adapters shared by product, wishlist and cart screens.
// Adapt database names to the original GAZU card layout.
export function toProduct(p) {
  return {
    ...p,
    id: p._id,
    price: p.pricePaise / 100,
    old: p.originalPricePaise > p.pricePaise ? p.originalPricePaise / 100 : undefined,
    originalPrice: p.originalPricePaise ? p.originalPricePaise / 100 : "",
    available: p.active && p.inStock && p.quantity > 0 && p.tag !== "PRICE PENDING",
    pricePending: p.tag === "PRICE PENDING",
  };
}
export function toCart(lines) {
  return lines
    .filter((line) => line.product)
    .map((line) => ({ ...toProduct(line.product), qty: line.quantity, size: line.size || "", variantQuantity:line.size ? (line.product.variants||[]).find(v=>v.size===line.size)?.quantity ?? 0 : line.product.quantity }));
}

