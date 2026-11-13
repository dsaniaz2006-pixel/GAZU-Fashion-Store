import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    type: { type: String, enum: ["order_confirmation"], required: true },
    recipient: { type: String, required: true },
    status: { type: String, enum: ["sending", "sent", "failed"], default: "sending" },
    sentAt: Date,
    error: String,
  },
  { timestamps: true },
);
schema.index({ order: 1, type: 1 }, { unique: true });
export default mongoose.model("OrderNotification", schema);
