import mongoose from "mongoose";
import Product from "./Product.js";
const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true, validate: Number.isInteger },
    comment: { type: String, trim: true, minlength: 3, maxlength: 1000, required: true },
  },
  { timestamps: true },
);
schema.index({ user: 1, product: 1 }, { unique: true });
schema.statics.recalculateRating = async function (productId, session) {
  const [result] = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: null,
        rating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]).session(session || null);
  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        rating: result?.rating || 0,
        reviewCount: result?.reviewCount || 0,
      },
    },
    { session },
  );
};
schema.post("save", async function (doc) {
  await doc.constructor.recalculateRating(doc.product, doc.$session());
});
schema.post("deleteOne", { document: true, query: false }, async function () {
  await this.constructor.recalculateRating(this.product, this.$session());
});
export default mongoose.model("Review", schema);
