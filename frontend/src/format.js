export const image = (id, w = 800) =>
  (/^\/products\/men-(footwear|topwear|bottomwear|winterwear|accessories|lookbook)\/[a-z0-9-]+\.webp$/.test(id || ""))
    ? id // static assets are deployed with the frontend; no backend upload dependency
    : id?.startsWith("/uploads/")
      ? (import.meta.env.VITE_API_URL || "/api").replace(/\/api\/?$/, "") + id
      : `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
export const money = (n) => {
  const decimals = Number.isInteger(n) ? 0 : 2;
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: 2 })}`;
};
