import mongoose from "mongoose";
// Browser binding only, never a Google token. TTL cleanup is not the expiry check.
const schema = new mongoose.Schema({
  _id: String,
  nonce: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model("GoogleChallenge", schema);
