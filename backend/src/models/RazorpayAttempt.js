import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requestId: { type: String, required: true },
    intentHash: { type: String, required: true },
    cartHash: { type: String, required: true },
    amountPaise: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "creating",
        "created",
        "processing",
        "complete",
        "refunding",
        "refunded",
      ],
      default: "pending",
    },
    leaseUntil: Date,
    gatewayOrderId: String,
    paymentId: String,
    refundId: String,
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true },
);

schema.index({ user: 1, requestId: 1 }, { unique: true });

export default mongoose.model("RazorpayAttempt", schema);
