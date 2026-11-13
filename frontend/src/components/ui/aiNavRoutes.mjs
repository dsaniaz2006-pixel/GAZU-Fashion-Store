/** One source of truth for customer-facing AI destinations. */
export const GAZU_AI_LINKS = Object.freeze([
  { label: "Shop the Look", route: "/shop-the-look", destination: "shop-the-look" },
  { label: "Style Finder", route: "/style-finder", destination: "style-finder" },
  { label: "AI Assistant", route: "/ai-assistant", destination: "ai-assistant" },
  { label: "Visual Search", route: "/visual-search", destination: "visual-search" },
  { label: "Discover", route: "/discover", destination: "discover" },
  { label: "Size & Fit", route: "/fit-assistant", destination: "fit-assistant" },
  { label: "Order Support", route: "/support", destination: "support" },
]);

export const GAZU_ADMIN_AI_LINKS = Object.freeze([
  { label: "AI Admin Studio", route: "/admin/ai-studio", destination: "admin/ai-studio" },
  { label: "Inventory Forecast", route: "/admin/inventory-forecast", destination: "admin/inventory-forecast" },
]);

export const isGazuAiRoute = (pathname = "") =>
  [...GAZU_AI_LINKS, ...GAZU_ADMIN_AI_LINKS].some((entry) => entry.route === pathname);
