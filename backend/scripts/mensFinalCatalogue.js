// GAZU men's final collection — individually cropped from 19 user-provided screenshot images.
// 12 Bottomwear + 15 Winterwear + 5 Accessories. This adds only missing products.
// Product names, prices and discounts are sourced from visible screenshot captions.
// The Levi's 568 jeans already exists in mensClothingCatalogue.js and is not duplicated.
// Four corduroy products have no price in the source: non-purchasable, price-pending placeholders.
const bottomwear = [
  { name: "Levi's 511 Charcoal Grey Slim Fit Mid Rise Jeans", img: 'levis-511-charcoal-grey-slim-jeans', color: 'Charcoal Grey', pricePaise:179900, originalPricePaise:299900, tag:'SALE 40%', description: "Men's Levi's 511 charcoal-grey slim-fit, mid-rise jeans. The photograph includes styled shoes and top, which are not part of the product." },
  { name: "Levi's 505 Mid Rise Straight Fit Cotton Stretch Blend Jeans", img:'levis-505-blue-straight-jeans', color:'Dark Blue Denim', pricePaise:179900, originalPricePaise:299900, tag:'SALE 40%', description: "Men's Levi's 505 straight-fit mid-rise denim jeans in dark blue, as pictured." },
  { name:'Blue Screen Super Baggy Jeans', img:'blue-screen-super-baggy-jeans', color:'Washed Blue / Grey', pricePaise:169000, description:'Super baggy washed denim jeans with an extra-wide leg. Reference includes a 4.6/5 rating from 44 reviews; ratings are not imported as shop reviews.' },
  { name:"Men's Grey Straight Fit Mid Rise Commuter Cargos", img:'grey-straight-commuter-cargos', color:'Grey', pricePaise:142700, originalPricePaise:339900, tag:'SALE 58%', description:'Grey straight-fit mid-rise commuter cargo trousers with multiple practical pockets.' },
  { name:'Pinstripe Pleated Trousers — Black', img:'pinstripe-pleated-trousers', color:'Black Pinstripe', pricePaise:435000, description:'Black relaxed pleated wide-leg formal trousers with fine vertical pinstripes.' },
  { name:'Relaxed Fit Pleated Trousers — Brown', img:'relaxed-fit-pleated-trousers', color:'Brown', pricePaise:295000, description:'Relaxed-fit pleated brown trousers with tailored waistband and broad leg.' },
  { name:'Relaxed Corduroy Carpenter Pant — Black', img:'relaxed-corduroy-carpenter-black', color:'Black', pricePending:true, description:'Relaxed black corduroy carpenter trousers. The source screenshot gives no price; administrator must set a verified price before this item can be purchased.' },
  { name:'Relaxed Fit Corduroy Carpenter Pant — Navy', img:'relaxed-corduroy-carpenter-navy', color:'Navy Blue', pricePending:true, description:'Relaxed-fit navy corduroy carpenter trousers. Price was not shown in the source screenshot.' },
  { name:'Stretch Corduroy 5-Pocket Pant — Brown', img:'stretch-corduroy-five-pocket-brown', color:'Brown', pricePending:true, description:'Brown stretch corduroy five-pocket trousers. Source screenshot does not show a price.' },
  { name:'Corduroy Pull-On Pant — Khaki', img:'corduroy-pull-on-beige', color:'Khaki / Beige', pricePending:true, description:'Khaki corduroy pull-on trousers with relaxed cut. Source screenshot does not show a price.' },
  { name:"Nike Club Men's Woven Cargo Trousers — Black", img:'nike-club-cargo-black', color:'Black', pricePaise:349500, description:'Nike Club mens woven cargo trousers in black, elastic ankle and cargo pockets.' },
  { name:"Nike Club Men's Woven Cargo Trousers — Khaki", img:'nike-club-cargo-khaki', color:'Khaki', pricePaise:244700, originalPricePaise:349500, tag:'SALE 30%', description:'Nike Club mens woven cargo trousers in khaki, with side cargo pockets and elastic ankle.' },
];
const winterwear = [
  { name:"Men's Solid Regular Fit Denim Jacket — Light Blue", img:'denim-jacket-light-blue', color:'Light Blue Denim', pricePaise:449900, originalPricePaise:499900, tag:'SALE 10%', description:'Light blue regular-fit denim jacket with front chest pockets and metal buttons.' },
  { name:"Men's Solid Regular Fit Denim Jacket — Indigo", img:'denim-jacket-indigo', color:'Dark Indigo', pricePaise:449900, originalPricePaise:499900, tag:'SALE 10%', description:'Indigo blue regular-fit denim jacket with metal-button front and chest pockets.' },
  { name:"Men's Solid Regular Fit Denim Jacket — Black", img:'denim-jacket-black', color:'Black', pricePaise:449900, originalPricePaise:499900, tag:'SALE 10%', description:'Black regular-fit denim jacket with chest pockets and button front.' },
  { name:'Regular Fit Faux Suede Jacket — Dark Brown', img:'regular-fit-faux-suede-jacket', color:'Dark Brown', pricePaise:655000, description:'Dark brown regular fit faux-suede zip-front jacket, classic collared neckline.' },
  { name:'Regular Fit Leather Effect Jacket — Brown', img:'regular-fit-leather-effect-jacket', color:'Brown', pricePaise:655000, description:'Brown leather-effect regular fit zip jacket with collar.' },
  { name:'Embossed Leather Effect Jacket — Charcoal', img:'embossed-leather-effect-jacket', color:'Charcoal / Gunmetal', pricePaise:655000, tag:'NEW', description:'Charcoal textured embossed leather-effect jacket with stand collar and zip front.' },
  { name:'Faux Suede Bomber Jacket — Stone', img:'faux-suede-bomber-jacket', color:'Stone / Cream', pricePaise:555000, description:'Stone cream faux-suede bomber jacket with ribbed trim and embroidered chest graphics.' },
  { name:'Cable-Knit Polo-Collar Cotton Jumper — Navy', img:'cable-knit-polo-collar-jumper-navy', color:'Navy Blue', pricePaise:3360000, tag:'NEW ARRIVAL', description:'Polo Ralph Lauren navy cable-knit cotton jumper with polo collar and embroidered logo.' },
  { name:'Relaxed Cable-Knit Wool-Cashmere Jumper — Cream', img:'relaxed-cable-knit-wool-cashmere-jumper', color:'Cream / Ivory', pricePaise:3490000, description:'Polo Ralph Lauren relaxed cream cable-knit wool-cashmere jumper with quarter zip.' },
  { name:'Quarter-Zip Cotton Mockneck Jumper — Navy', img:'quarter-zip-cotton-mockneck-jumper', color:'Navy Blue', pricePaise:3150000, description:'Polo Ralph Lauren navy quarter-zip cotton mockneck jumper. Reference displays a ₹31,500–₹33,600 price range; the starting price is used.' },
  { name:'Relaxed Aran-Knit Polo-Collar Jumper — Charcoal', img:'relaxed-aran-knit-polo-collar-jumper', color:'Charcoal Grey', pricePaise:4430000, tag:'NEW ARRIVAL', description:'Polo Ralph Lauren relaxed dark charcoal Aran-knit jumper with collared button opening.' },
  { name:'Wool-Blend Shawl Cardigan — Olive', img:'wool-blend-shawl-cardigan', color:'Olive Brown', pricePaise:3790000, description:'Polo Ralph Lauren ribbed wool-blend shawl-collar button cardigan in olive-brown.' },
  { name:'Regular Fit Transitional Jacket — Black', img:'regular-fit-transitional-jacket-black', color:'Black', pricePaise:1019900, originalPricePaise:1199900, tag:'SALE 15%', description:'Tommy Hilfiger black regular-fit transitional zip-front jacket.' },
  { name:'Regular Fit Transitional Jacket — Cream', img:'regular-fit-transitional-jacket-cream', color:'Cream', pricePaise:1019900, originalPricePaise:1199900, tag:'SALE 15%', description:'Tommy Hilfiger cream regular-fit transitional zip-front jacket.' },
  { name:'Regular Fit Mix Media Jacket — Light Grey', img:'regular-fit-mix-media-jacket', color:'Light Grey', pricePaise:1104900, originalPricePaise:1299900, tag:'SALE 15%', description:'Tommy Hilfiger regular-fit light-grey mixed-media quilted front jacket with knit sleeves.' },
];
const accessories = [
  { name:'Leather Card Holder With MagSafe — Black', img:'leather-card-holder-magsafe-black', color:'Black', pricePaise:1220000, description:'Polo Ralph Lauren pebbled full-grain leather MagSafe card holder, black, with front leather slot and signature Polo lettering.' },
  { name:'Pebbled Leather Card Holder — Brown', img:'pebbled-leather-card-holder-brown', color:'Dark Brown', pricePaise:1080000, description:'Polo Ralph Lauren compact brown pebbled leather card holder with multiple slots and embossed Pony logo.' },
  { name:'Heritage Pen-Hinge Round Sunglasses', img:'heritage-pen-hinge-round-sunglasses', color:'Black / Dark Grey', pricePaise:2330000, description:'Polo Ralph Lauren Heritage Pen-Hinge round black sunglasses with dark lenses. Source mentions two colours, but only the pictured variant is provided.' },
  { name:'Heritage Rugby-Stripe Sunglasses', img:'heritage-rugby-stripe-sunglasses', color:'Black / Dark Grey', pricePaise:1580000, description:'Polo Ralph Lauren Heritage Rugby-Stripe square black sunglasses with dark lenses and temple stripe detail.' },
  { name:'Heritage Pen-Pin Round Sunglasses', img:'heritage-pen-pin-round-sunglasses', color:'Black / Green', pricePaise:2460000, description:'Polo Ralph Lauren Heritage Pen-Pin semi-rim round sunglasses with green lenses.' },
];
const make = (rows, type, section) => rows.map(({img,pricePending,...p})=>Object.freeze({
  ...p,
  category:'Men', type, img:`/products/${section}/${img}.webp`,
  ...(pricePending ? { pricePaise:1, quantity:0, inStock:false, tag:'PRICE PENDING' } : {quantity:10, inStock:true}),
}));
export const FINAL_BOTTOMWEAR_PRODUCTS=Object.freeze(make(bottomwear,'Bottomwear','men-bottomwear'));
export const FINAL_WINTERWEAR_PRODUCTS=Object.freeze(make(winterwear,'Winterwear','men-winterwear'));
export const FINAL_ACCESSORY_PRODUCTS=Object.freeze(make(accessories,'Accessories','men-accessories'));
export const MENS_FINAL_PRODUCTS=Object.freeze([...FINAL_BOTTOMWEAR_PRODUCTS,...FINAL_WINTERWEAR_PRODUCTS,...FINAL_ACCESSORY_PRODUCTS]);
export const MENS_FINAL_NAMES=Object.freeze(MENS_FINAL_PRODUCTS.map(p=>p.name));
export const MENS_BOTTOMWEAR_EDITORIAL=Object.freeze(['Khaki','Cargo','Linen','Denim'].map(s=>({label:s,img:`/products/men-lookbook/bottomwear-edit-${s.toLowerCase()}.webp`})));
export function planMensFinalImport(existing){
  const byName=new Map();
  for (const item of existing){ if (byName.has(item.name)) throw new Error(`Duplicate product name in database: ${item.name}`); byName.set(item.name,item); }
  return {
    toCreate:MENS_FINAL_PRODUCTS.filter(p=>!byName.has(p.name)),
    alreadyPresent:MENS_FINAL_PRODUCTS.filter(p=>byName.has(p.name)).map(p=>byName.get(p.name)),
  };
}
