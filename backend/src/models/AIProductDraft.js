import mongoose from 'mongoose';
const schema=new mongoose.Schema({product:{type:mongoose.Schema.Types.ObjectId,ref:'Product',required:true},actor:{type:mongoose.Schema.Types.ObjectId,ref:'User'},status:{type:String,enum:['pending','approved','rejected'],default:'pending'},suggestion:{type:mongoose.Schema.Types.Mixed,required:true},sourceFingerprint:{type:String,required:true},provider:{type:String,default:'mock'},reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},reviewedAt:Date},{timestamps:true});
schema.index({product:1,createdAt:-1});
schema.index({status:1,createdAt:-1});
export default mongoose.model('AIProductDraft',schema);
