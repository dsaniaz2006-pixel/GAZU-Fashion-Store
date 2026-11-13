/** Single source of truth for the Men, Account and Admin segmented navigation. */
export const MEN_SECTIONS = Object.freeze(["", "Topwear", "Bottomwear", "Winterwear", "Footwear", "Accessories"]);
export const MEN_SECTION_ITEMS = Object.freeze(MEN_SECTIONS.map((value) => Object.freeze({
  label: value ? value.toUpperCase() : "ALL MEN",
  value,
})));
export const ACCOUNT_SECTION_ITEMS = Object.freeze([
  { label: "ACCOUNT", path: "/account" },
  { label: "PROFILE", path: "/account/profile" },
  { label: "MY ORDERS", path: "/account/orders" },
]);
export const ADMIN_SECTION_ITEMS = Object.freeze([
  { label: "PRODUCTS", path: "/admin/products" },
  { label: "ORDERS", path: "/admin/orders" },
  { label: "STATISTICS", path: "/admin/stats" },
  { label: "MARKETING", path: "/admin/marketing" },
  { label: "STAFF", path: "/admin/staff" },
  { label: "OPERATIONS", path: "/admin/operations" },
  { label: "AI STUDIO", path: "/admin/ai-studio" },
  { label: "FORECAST", path: "/admin/inventory-forecast" },
]);
export const menSectionIndex = (value) => Math.max(0, MEN_SECTIONS.indexOf(value || ""));
export const accountSectionIndex = (pathname) => pathname.startsWith('/account/orders') ? 2 : pathname.startsWith('/account/profile') ? 1 : 0;
export const adminSectionIndex = (pathname) => pathname.startsWith('/admin/orders') ? 1 : pathname === '/admin'||pathname.startsWith('/admin/stats') ? 2 : pathname.startsWith('/admin/marketing') ? 3 : pathname.startsWith('/admin/staff') ? 4 : pathname.startsWith('/admin/operations') ? 5 : pathname.startsWith('/admin/ai-studio') ? 6 : pathname.startsWith('/admin/inventory-forecast') ? 7 : 0;
