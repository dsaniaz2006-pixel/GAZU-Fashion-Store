import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, required: true },
    type: { type: String, default: "T-Shirts" },
    color: { type: String, default: "" },
    tag: { type: String, default: "" },
    img: { type: String, default: "photo-1521572163474-6864f9cf17ab" },
    imageMeta: {type:new mongoose.Schema({widthPx:Number,heightPx:Number,source:String,verifiedAt:Date},{_id:false}),default:undefined},
    // Money is stored as integer paise, never floating-point rupees.
    pricePaise: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger,
    },
    originalPricePaise: { type: Number, default: null, min: 1, validate: (n) => n == null || Number.isSafeInteger(n) },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
    inStock: { type: Boolean, default: true },
    // Legacy products without variants still use aggregate quantity.
    variants: { type: [{ size: {type:String,required:true}, quantity:{type:Number,min:0,required:true} }], default: [] },
    sizeGuide: {type:String,default:''},
    // Staff-verified BODY measurement ranges, in centimetres. Optional; no silent guessing.
    fitData: { type: new mongoose.Schema({
      verified: {type:Boolean,default:false},
      source: {type:String,maxlength:160},
      measuredAt: Date,
      verifiedBy: {type:mongoose.Schema.Types.ObjectId,ref:'User'},
      measurementType: {type:String,enum:['body'],default:'body'},
      unit: {type:String,enum:['cm'],default:'cm'},
      rows: {type:[new mongoose.Schema({
        size:{type:String,required:true,maxlength:16},
        chestMinCm:Number,chestMaxCm:Number,
        waistMinCm:Number,waistMaxCm:Number,
        hipMinCm:Number,hipMaxCm:Number,
      },{_id:false})],default:[]},
    },{_id:false}),default:undefined},
    sku: {type:String,trim:true},
    publicationStatus: {type:String,enum:['draft','review','published'],default:'published'},
    styleTags: {type:[String],default:[]},
    aiEmbedding: { type: new mongoose.Schema({ values: { type: [Number], select: false }, model: String, fingerprint: String, indexedAt: Date }, { _id: false }), select: false },
    // Soft deletion hides the product while keeping order references intact.
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
schema.add({
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
});
schema.set("toJSON", { virtuals: true });
schema.virtual("priceRupees").get(function () {
  return this.pricePaise / 100;
});
schema.pre("save", function () {
  this.name = this.name.trim().replace(/\s+/g, " ");
});
schema.index({ name: "text", description: "text" });
schema.index({ category: 1, pricePaise: 1 });
schema.index({ sku: 1 }, { unique: true, partialFilterExpression: { sku: { $type: 'string' } } });

function inferMenSection(product) {
  const rawType = String(product.type || '').toLowerCase();
  const name = String(product.name || '').toLowerCase();
  if (rawType === 'topwear' || rawType === 't-shirts' || rawType === 'shirts' || rawType === 'polo' || rawType === 'tees' || name.includes('tee') || name.includes('t-shirt') || name.includes('shirt') || name.includes('polo')) return 'Topwear';
  if (rawType === 'bottomwear' || name.includes('jeans') || name.includes('trouser') || name.includes('cargo') || name.includes('pant')) return 'Bottomwear';
  if (rawType === 'winterwear' || name.includes('jacket') || name.includes('blazer') || name.includes('coat') || name.includes('cardigan') || name.includes('jumper') || name.includes('pullover')) return 'Winterwear';
  if (rawType === 'footwear' || name.includes('shoe') || name.includes('sneaker') || name.includes('loafer') || name.includes('boot') || name.includes('samba') || name.includes('speedcat') || name.includes('jordan')) return 'Footwear';
  if (rawType === 'accessories' || name.includes('watch') || name.includes('sunglasses') || name.includes('belt') || name.includes('wallet') || name.includes('holder') || name.includes('cap') || name.includes('hat')) return 'Accessories';
  return product.type || 'Other';
}

function inferMenSubgroup(product) {
  const section = inferMenSection(product);
  const name = String(product.name || '').toLowerCase();

  if (section === 'Topwear') {
    if (name.includes('tee') || name.includes('t-shirt')) return 0; // T-Shirts
    if (name.includes('polo')) return 1; // Polos
    if (name.includes('formal')) return 3; // Formal shirts
    if (name.includes('shirt')) return 2; // Casual shirts
    return 9;
  }

  if (section === 'Bottomwear') {
    if (name.includes('jeans') || name.includes('denim')) return 0;
    if (name.includes('cargo')) return 1;
    if (name.includes('trouser') || name.includes('pant')) return 2;
    return 9;
  }

  if (section === 'Winterwear') {
    if (name.includes('jacket')) return 0;
    if (name.includes('blazer')) return 1;
    if (name.includes('coat')) return 2;
    if (name.includes('cardigan') || name.includes('jumper') || name.includes('pullover')) return 3;
    return 9;
  }

  if (section === 'Footwear') {
    if (name.includes('loafer') || name.includes('chelsea')) return 2; // formal shoes
    if (name.includes('casual')) return 1;
    if (name.includes('shoe') || name.includes('sneaker') || name.includes('jordan') || name.includes('puma') || name.includes('adidas') || name.includes('samba') || name.includes('speedcat')) return 0;
    return 9;
  }

  if (section === 'Accessories') {
    if (name.includes('watch')) return 0;
    if (name.includes('sunglasses')) return 1;
    if (name.includes('belt')) return 2;
    if (name.includes('wallet') || name.includes('holder')) return 3;
    if (name.includes('cap') || name.includes('hat')) return 4;
    return 9;
  }

  return 9;
}

function menFeaturedComparator(a, b) {
  const sectionOrder = { Topwear: 0, Bottomwear: 1, Winterwear: 2, Footwear: 3, Accessories: 4 };
  const aSection = inferMenSection(a);
  const bSection = inferMenSection(b);
  const aRank = sectionOrder[aSection] ?? 99;
  const bRank = sectionOrder[bSection] ?? 99;
  if (aRank !== bRank) return aRank - bRank;

  const aGroup = inferMenSubgroup(a);
  const bGroup = inferMenSubgroup(b);
  if (aGroup !== bGroup) return aGroup - bGroup;

  const aPricePending = a.tag === 'PRICE PENDING';
  const bPricePending = b.tag === 'PRICE PENDING';
  if (aPricePending !== bPricePending) return aPricePending ? 1 : -1;

  return String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' });
}
schema.statics.search = async function ({ q = "", category, type, sort = "featured", page = 1, limit = 12 } = {}) {
  // The HTTP route validates these too. Defend the reusable model API against
  // malformed direct calls, unsafe skip values, and unsupported sort keys.
  const sorts = {
    newest: { createdAt: -1, _id: -1 },
    price_asc: { pricePaise: 1, _id: 1 },
    price_desc: { pricePaise: -1, _id: 1 },
    featured: { createdAt: 1, _id: 1 },
  };
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50 ||
      typeof q !== "string" || q.length > 100 ||
      (category !== undefined && !["Men", "Women", "Kids", "Accessories"].includes(category)) ||
      (type !== undefined && (typeof type !== "string" || !type.trim() || type.length > 50)) ||
      !Object.hasOwn(sorts, sort)) {
    throw new Error("Invalid product search filters.");
  }
  q = q.trim();
  const filter = {
    active: true,
    $or: [{publicationStatus:'published'},{publicationStatus:{$exists:false}}],
    ...(q ? { $text: { $search: q } } : {}),
    ...(category ? { category } : {}),
    ...(type ? { type: type.trim() } : {}),
  };

  if (category === 'Men' && sort === 'featured') {
    const allItems = await this.find(filter);
    const ordered = [...allItems].sort(menFeaturedComparator);
    const total = ordered.length;
    const start = (page - 1) * limit;
    const items = ordered.slice(start, start + limit);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  const [items, total] = await Promise.all([
    this.find(filter)
      .sort(sorts[sort])
      .skip((page - 1) * limit)
      .limit(limit),
    this.countDocuments(filter),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
};
export default mongoose.model("Product", schema);
