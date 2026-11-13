import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    
user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
requestId: { type: String, required: true },

orderNumber: {
  type: String,
  unique: true,
  sparse: true,
  immutable: true,
},

items: [

      {
        product: mongoose.Schema.Types.ObjectId,
        name: String,
        size: {type:String,default:''},
        quantity: Number,
        unitPricePaise: Number,
      },
    ],
    shipping: {
      name: String,
      address: String,
      city: String,
      pin: String,
      phone: String,
    },
    subtotalPaise: Number,
    deliveryPaise: Number,
    discountPaise: {type:Number,default:0},
    giftUsedPaise: {type:Number,default:0},
    couponCode: {type:String,default:''},
    totalPaise: Number,
    paymentMethod: { type: String, enum: ["cod", "mock", "razorpay"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "mock_paid", "paid", "collected"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["placed", "preparing", "out_for_delivery", "delivered"],
      default: "placed",
    },
  },
  { timestamps: true },
);
schema.index({ user: 1, requestId: 1 }, { unique: true });
schema.set("toJSON", { virtuals: true });
schema.virtual("itemCount").get(function () {
  return this.items.reduce((n, i) => n + i.quantity, 0);
});
export default mongoose.model("Order", schema);
