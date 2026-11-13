export const GAZU_LIQUID_LINKS = Object.freeze([
  { label: "HOME", destination: "home" },
  { label: "MEN", destination: "shop", category: "Men" },
  { label: "WOMEN", destination: "shop", category: "Women" },
  { label: "KIDS", destination: "shop", category: "Kids" },
  { label: "SHOP", destination: "shop", category: "All" },
  { label: "STORY", destination: "about" },
]);

export function activeGazuLiquidItem(pathname, search = "") {
  if (pathname === "/") return 0;
  if (pathname === "/about") return 5;
  if (pathname === "/shop") {
    const category = new URLSearchParams(search).get("category");
    if (category === "Men") return 1;
    if (category === "Women") return 2;
    if (category === "Kids") return 3;
    return 4;
  }
  // Product, cart, account, and admin pages have no selected primary category.
  return -1;
}


/** -1 keeps the liquid selector invisible on unrelated pages, avoiding a
 * misleading selected utility. Search is selected only while its panel is open. */
export function activeGazuUtilityItem(pathname, searchOpen = false, isAdmin = false) {
  if (searchOpen) return 0;
  if (pathname === "/account" || pathname.startsWith("/account/")) return 1;
  if (pathname === "/wishlist") return 2;
  if (pathname === "/cart" || pathname === "/checkout") return 3;
  if (isAdmin && (pathname === "/admin" || pathname.startsWith("/admin/"))) return 4;
  return -1;
}
