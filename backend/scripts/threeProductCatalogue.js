// The ONLY bundled store catalogue. No legacy Men's collection records are included.
// These are the original demo products shown on the GAZU homepage.
export const DEMO_PRODUCTS = Object.freeze([
  Object.freeze({
    name: "Relaxed Cotton Tee", category: "Men", type: "T-Shirts",
    pricePaise: 129900, quantity: 12, color: "Stone", tag: "BESTSELLER",
    img: "photo-1521572163474-6864f9cf17ab",
    description: "A relaxed everyday cotton tee.",
  }),
  Object.freeze({
    name: "Soft Knit Pullover", category: "Women", type: "Knitwear",
    pricePaise: 249900, quantity: 8, color: "Oat", tag: "NEW",
    img: "photo-1434389677669-e08b4cac3105",
    description: "A soft layer for cool evenings.",
  }),
  Object.freeze({
    name: "Structured Tote", category: "Accessories", type: "Accessories",
    pricePaise: 99900, quantity: 5, color: "Black", tag: "",
    img: "photo-1548036328-c9fa89d128fa",
    description: "A practical bag for daily essentials.",
  }),
]);

export const DEMO_NAMES = Object.freeze(DEMO_PRODUCTS.map((product) => product.name));
const demoSet = new Set(DEMO_NAMES);
// SKU format from the former Men's import, not a copy of its catalogue.
const oldMensSku = /^GAZU-M-(?:TOP|BOT|OUT|FTW|ACC)-(?:00[1-9]|01[0-5])$/i;
const formerMenSection = /^(?:topwear|bottomwear|outerwear|footwear|accessories)$/i;

export function classifyCatalogueProduct(product) {
  if (demoSet.has(product.name)) return "keep";
  if (oldMensSku.test(product.sku || "")) return "legacy-men";
  // Older imports may have saved the product without its SKU. Require
  // BOTH the prior import's department and its five-section metadata,
  // as well as its name prefix; unrelated new GAZU products are untouched.
  if (!product.sku && /^GAZU\s/i.test(product.name || "") &&
      String(product.department || "").toLowerCase() === "men" &&
      formerMenSection.test(String(product.mainCategory || ""))) {
    return "legacy-men";
  }
  return "other";
}

export function planThreeProductCleanup(allDocuments) {
  const active = allDocuments.filter((p) => p.active !== false);
  const retired = active.filter((p) => classifyCatalogueProduct(p) === "legacy-men");
  const unknown = active.filter((p) => classifyCatalogueProduct(p) === "other");
  const included = new Map();
  for (const p of allDocuments) {
    if (demoSet.has(p.name)) {
      if (included.has(p.name)) {
        throw new Error(`Multiple database products share the demo name: ${p.name}. Resolve this manually before applying.`);
      }
      included.set(p.name, p);
    }
  }
  const toCreate = DEMO_PRODUCTS.filter((p) => !included.has(p.name));
  const toRestore = DEMO_PRODUCTS.filter((p) => included.get(p.name)?.active === false);
  return { retired, unknown, toCreate, toRestore, active, keep: DEMO_NAMES.map((name) => included.get(name)).filter(Boolean) };
}
