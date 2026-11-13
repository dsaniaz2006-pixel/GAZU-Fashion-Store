// Individually cropped from the footwear screenshots supplied for the GAZU project.
// These are demonstration catalogue entries. Set real stock in Admin before launch.
const footwear = [
  {
    name: "Jordan Sixty Plus Low", pricePaise: 1529500, color: "Black",
    tag: "JUST IN", img: "jordan-sixty-plus-low",
    description: "Nike Jordan Sixty Plus Low men's shoes in an all-black low-top silhouette.",
  },
  {
    name: "Air Jordan 1 Retro High OG Flight Club", pricePaise: 1699500,
    color: "Black / Red / White", img: "air-jordan-1-flight-club",
    description: "Nike Air Jordan 1 Retro High OG Flight Club men's high-top sneakers, with contrast stitching and red accent branding.",
  },
  {
    name: "Air Jordan 1 High OG 'Royal'", pricePaise: 1699500,
    color: "Black / Royal Blue", tag: "JUST IN", img: "air-jordan-1-royal",
    description: "Nike Air Jordan 1 High OG 'Royal' men's shoes in black and royal blue.",
  },
  {
    name: "Air Jordan 1 Retro High OG 'Love Letter'", pricePaise: 1699500,
    color: "Black / White / Brown", img: "air-jordan-1-love-letter",
    description: "Nike Air Jordan 1 Retro High OG 'Love Letter' men's high-top shoes with dark overlays and brown heel panels.",
  },
  {
    name: "Air Jordan 5 Retro 'Halloween'", pricePaise: 1929500,
    color: "Black / Red", tag: "JUST IN", img: "air-jordan-5-halloween",
    description: "Nike Air Jordan 5 Retro 'Halloween' men's shoes, black upper with red midsole details.",
  },
  {
    name: "Bordo Loafer for Men", pricePaise: 599700,
    originalPricePaise: 999500, color: "Burgundy", tag: "SALE 40%",
    img: "bordo-loafer",
    description: "Burgundy leather slip-on tassel loafers with a polished finish, shown as a pair.",
  },
  {
    name: "Dtan Penny Loafer for Men", pricePaise: 599700,
    originalPricePaise: 999500, color: "Brown", tag: "SALE 40%",
    img: "dtan-penny-loafer",
    description: "Brown textured leather slip-on loafers with tassel detailing.",
  },
  {
    name: "Brown Chelsea Boots for Men", pricePaise: 974600,
    originalPricePaise: 1299500, color: "Dark Brown", tag: "OUTDOOR SALE",
    img: "brown-chelsea-boots",
    description: "Dark brown suede Chelsea boots with elastic side panels and pull tabs, shown as a pair.",
  },
  {
    name: "Suede Charles F. Stead Sneakers", pricePaise: 1099900,
    color: "Black / Cream", img: "puma-suede-charles-f-stead",
    description: "PUMA suede low-top sneakers with a cream Formstrip and matching sole.",
  },
  {
    name: "Speedcat Plus Sneakers", pricePaise: 1099900,
    color: "Black / White", img: "puma-speedcat-plus",
    description: "PUMA Speedcat Plus black low-profile sneakers with a contrasting white Formstrip.",
  },
  {
    name: "McLAREN RACING Speedcat Sneakers", pricePaise: 1099900,
    color: "Black / Orange", img: "puma-mclaren-speedcat",
    description: "PUMA McLaren Racing Speedcat sneakers with motorsport-inspired orange accents.",
  },
  {
    name: "PUMA x ASTON MARTIN ARAMCO F1 TEAM Speedcat Sneakers",
    pricePaise: 1099900, color: "Black / Teal", img: "puma-aston-martin-speedcat",
    description: "PUMA x Aston Martin Aramco F1 Team Speedcat sneakers with teal-green accents.",
  },
  {
    name: "Samba OG Shoes", pricePaise: 1099900,
    color: "White / Black / Gum", img: "adidas-samba-og",
    description: "adidas Originals Samba OG low-top shoes with white upper, black three stripes and gum sole.",
  },
  {
    name: "ADVANTAGE BASE SHOES", pricePaise: 329950,
    originalPricePaise: 659900, color: "White", tag: "SALE 50%",
    img: "adidas-advantage-base",
    description: "adidas Advantage Base men's white lace-up sportswear sneakers.",
  },
];

export const FOOTWEAR_PRODUCTS = Object.freeze(footwear.map((p) => Object.freeze({
  ...p,
  category: "Men",
  type: "Footwear",
  img: `/products/men-footwear/${p.img}.webp`,
  quantity: 10, // demo inventory only; adjust in Admin before accepting real orders
  inStock: true,
})));
export const FOOTWEAR_NAMES = Object.freeze(FOOTWEAR_PRODUCTS.map((p) => p.name));

/** Plan an additive import, never touching existing products or historic orders. */
export function planFootwearImport(existing) {
  const byName = new Map();
  for (const item of existing) {
    if (byName.has(item.name)) throw new Error(`Duplicate product name in database: ${item.name}`);
    byName.set(item.name, item);
  }
  return {
    toCreate: FOOTWEAR_PRODUCTS.filter((p) => !byName.has(p.name)),
    alreadyPresent: FOOTWEAR_PRODUCTS.filter((p) => byName.has(p.name)).map((p) => byName.get(p.name)),
  };
}
