import mongoose from "mongoose";
const cartItem = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, min: 1, max: 99, required: true },
    size: {type:String,default:''},
  },
  { _id: false },
);
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: {
      type: String,
      select: false,
      required: function () {
        return this.isNew && !this.googleSub;
      },
    },
    googleSub: { type: String, select: false },
    disabled: { type: Boolean, default: false },
    sessionVersion: { type: Number, default: 0 },
    recoveryHash: { type: String, select: false },
    recoveryExpiresAt: Date,
    recoveryAttempts: { type: Number, default: 0 },
    recoveryLastSentAt: Date,
    recoveryWindowAt: Date,
    recoverySendCount: { type: Number, default: 0 },
    role: { type: String, enum: ["customer", "admin", "inventory_manager", "order_manager", "support_agent", "marketing_manager"], default: "customer" },
    emailVerified: { type: Boolean, default: false },
    // Only newly registered customers are eligible for one welcome email.
    welcomeEmailPending: { type: Boolean, default: false },
    welcomeEmailAttemptedAt: Date,
    welcomeEmailSentAt: Date,
    welcomeEmailFailedAt: Date,
    verificationLastSentAt: Date,
    verificationWindowAt: Date,
    verificationSendCount: { type: Number, default: 0 },
    cart: { type: [cartItem], default: [] },
    wishlist: {type:[{type:mongoose.Schema.Types.ObjectId,ref:'Product'}],default:[]},
    addresses: {type:[new mongoose.Schema({label:{type:String,default:'Home'},name:String,address:String,city:String,pin:String,phone:String,isDefault:{type:Boolean,default:false}})],default:[]},
    stylePreference: {type:String,enum:['heritage','minimal','street','active'],default:'heritage'},
    loyaltyPoints: {type:Number,default:0,min:0},
    referralCode: {type:String,uppercase:true},
  },
  { timestamps: true },
);
userSchema.index({referralCode:1},{unique:true,partialFilterExpression:{referralCode:{$type:'string'}}});
userSchema.index(
  { googleSub: 1 },
  { unique: true, partialFilterExpression: { googleSub: { $type: "string" } } },
);
export default mongoose.model("User", userSchema);
