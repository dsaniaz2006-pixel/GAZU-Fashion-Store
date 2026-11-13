import mongoose from "mongoose";
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requestId: { type: String, required: true },
  intentHash: { type: String, required: true },
  cartHash: { type: String, required: true },
  amountPaise: { type: Number, required: true },
  outcome: { type: String, enum: ["success", "failure"], required: true },
  status: { type: String, enum: ["pending", "processing", "approved", "declined", "complete"], default: "pending" },
  leaseUntil: Date,
  transactionId: String,
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
}, { timestamps: true });
schema.index({ user: 1, requestId: 1 }, { unique: true });
export default mongoose.model("PaymentAttempt", schema);
