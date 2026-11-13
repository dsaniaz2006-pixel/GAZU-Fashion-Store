import mongoose from 'mongoose';
const schema=new mongoose.Schema({inviter:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},invitee:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,unique:true},status:{type:String,enum:['pending','rewarded'],default:'pending'},rewardOrder:{type:mongoose.Schema.Types.ObjectId,ref:'Order'}},{timestamps:true});
export default mongoose.model('ReferralClaim',schema);
