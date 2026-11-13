// Pure route resolver for the public storefront. Browser navigation remains
// the responsibility of StorefrontProvider, not the route rules.
const CATEGORIES = new Set(["Men", "Women", "Kids", "Accessories"]);
const MEN_SECTIONS = new Set(["Topwear", "Bottomwear", "Footwear", "Winterwear", "Accessories"]);
const ALIASES = Object.freeze({ home: "/", track: "/account/orders", admin: "/admin/products" });

export function storefrontPath(page, category, subcategory, { searchOpen = false, query = "" } = {}) {
  let path = ALIASES[page] || `/${page}`;
  if (page !== "shop") return path;
  const params = new URLSearchParams();
  if (category && category !== "All" && CATEGORIES.has(category)) params.set("category", category);
  if (category === "Men" && MEN_SECTIONS.has(subcategory)) params.set("type", subcategory);
  if (searchOpen && query) params.set("q", query);
  return `${path}?${params}`;
}
