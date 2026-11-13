// Individually cropped from the 8 screenshots supplied for GAZU.
// Source price ranges are represented by their starting price, not an invented variant.
// Screenshots do not establish actual inventory; default quantities are DEMO placeholders.
const topwear = [
  {
    name: "Featherweight Mesh Shirt — Navy (Big & Tall)", pricePaise: 1870000,
    color: "Navy Blue", img: "featherweight-mesh-shirt-navy",
    description: "Polo Ralph Lauren Featherweight Mesh Shirt, Big & Tall fit, in navy blue with button front and embroidered chest logo. Screenshot lists ₹18,700.",
  },
  {
    name: "Slim Fit Stretch Poplin Shirt — Tan", pricePaise: 1870000,
    color: "Tan / Khaki", img: "slim-fit-stretch-poplin-shirt-tan",
    description: "Polo Ralph Lauren slim-fit stretch poplin button-down in tan. The reference lists a price range of ₹18,700–₹20,200; this listing uses the starting price.",
  },
  {
    name: "Featherweight Mesh Shirt — White", pricePaise: 1870000,
    color: "White", img: "featherweight-mesh-shirt-white",
    description: "Polo Ralph Lauren Featherweight Mesh Shirt in white, with blue embroidered chest emblem. The reference lists ₹18,700–₹20,200; this listing uses the starting price.",
  },
  {
    name: "Regular Fit Tipped Polo — Cream", pricePaise: 399900,
    color: "Cream / Navy", img: "regular-fit-tipped-polo",
    description: "Tommy Hilfiger regular-fit short sleeve tipped polo in cream, with contrasting collar and sleeve trim.",
  },
  {
    name: "Relaxed Fit Rugby Polo — Green", pricePaise: 475900,
    originalPricePaise: 559900, color: "Forest Green", tag: "SALE 15%",
    img: "relaxed-fit-rugby-polo",
    description: "Tommy Hilfiger relaxed-fit rugby polo with long sleeves and contrasting collar. Discount prices are taken from the reference screenshot.",
  },
  {
    name: "Long Sleeve Solid Textured Polo — Navy", pricePaise: 699900,
    color: "Navy Blue", img: "long-sleeve-textured-polo",
    description: "Tommy Hilfiger long-sleeve solid textured polo in navy blue. Reference image shows the back of the shirt.",
  },
  {
    name: "Regular Fit Contrast Collar Interlock Polo — Navy", pricePaise: 669900,
    color: "Navy Blue / White", img: "contrast-collar-interlock-polo",
    description: "Tommy Hilfiger short sleeve interlock polo with navy body, white contrast collar and matching striped sleeve cuffs.",
  },
  {
    name: "Johnny Collar Crepe Polo — Green", pricePaise: 599900,
    color: "Dark Green", img: "johnny-collar-crepe-polo",
    description: "Tommy Hilfiger Johnny-collar crepe polo in deep green, open placket and short sleeves.",
  },
  {
    name: "Slim Fit Oxford Shirt — White", pricePaise: 1990000,
    color: "White", img: "slim-fit-oxford-shirt", tag: "TRENDING",
    description: "Polo Ralph Lauren slim-fit Oxford button-down shirt in white. Reference price range: ₹19,900–₹22,900; this listing uses the starting price. No additional colour photos supplied.",
  },
  {
    name: "Custom Fit Gingham Oxford Shirt — Tan", pricePaise: 2120000,
    color: "Tan / White Gingham", img: "custom-fit-gingham-oxford-shirt",
    description: "Polo Ralph Lauren custom-fit gingham Oxford button-down, tan and white small check, long sleeves.",
  },
  {
    name: "Regular Fit Check Oxford Shirt — Blue Plaid", pricePaise: 599900,
    color: "Blue / White Check", img: "regular-fit-check-oxford-blue",
    description: "Tommy Hilfiger regular-fit Oxford shirt with blue-and-white plaid check. Individually cropped from a two-product reference.",
  },
  {
    name: "Regular Fit Check Oxford Shirt — Navy Windowpane", pricePaise: 659900,
    color: "Navy / Burgundy Check", img: "regular-fit-check-oxford-navy",
    description: "Tommy Hilfiger regular-fit Oxford shirt in navy with fine contrasting windowpane checks. Individually cropped from a two-product reference.",
  },
  {
    name: "Regular Fit Check Oxford Shirt — Green Micro Check", pricePaise: 599900,
    color: "Green / White Check", img: "regular-fit-check-oxford-green",
    description: "Tommy Hilfiger regular-fit Oxford shirt with small green-and-white check pattern, long sleeves.",
  },
];

const bottomwear = [{
  name: "Levi's 568 Blue Loose Fit Mid Rise Jeans", pricePaise: 335900,
  originalPricePaise: 479900, color: "Blue Denim", tag: "SALE 30%",
  img: "levis-568-blue-loose-fit-jeans",
  description: "Levi's men's 568 loose-fit, mid-rise blue denim jeans. Reference shows sale price ₹3,359 from ₹4,799; shirt and shoes in the photo are styling only, not included.",
}];

const finish = (rows, type, folder) => rows.map((p) => Object.freeze({
  ...p,
  category: "Men",
  type,
  img: `/products/${folder}/${p.img}.webp`,
  quantity: 10, // demo quantity only; administrator must verify real inventory
  inStock: true,
}));

// Keep screenshot order: Ralph Lauren shirts, Tommy polos, Oxford shirts; jeans in Bottomwear.
export const MENS_TOPWEAR_PRODUCTS = Object.freeze(finish(topwear, "Topwear", "men-topwear"));
export const MENS_BOTTOMWEAR_PRODUCTS = Object.freeze(finish(bottomwear, "Bottomwear", "men-bottomwear"));
export const MENS_CLOTHING_PRODUCTS = Object.freeze([...MENS_TOPWEAR_PRODUCTS, ...MENS_BOTTOMWEAR_PRODUCTS]);
export const MENS_CLOTHING_NAMES = Object.freeze(MENS_CLOTHING_PRODUCTS.map((p) => p.name));

/** Add only missing, uniquely named products; preserve every existing record unchanged. */
export function planMensClothingImport(existing) {
  const byName = new Map();
  for (const item of existing) {
    if (byName.has(item.name)) throw new Error(`Duplicate product name in database: ${item.name}`);
    byName.set(item.name, item);
  }
  return {
    toCreate: MENS_CLOTHING_PRODUCTS.filter((p) => !byName.has(p.name)),
    alreadyPresent: MENS_CLOTHING_PRODUCTS.filter((p) => byName.has(p.name)).map((p) => byName.get(p.name)),
  };
}
