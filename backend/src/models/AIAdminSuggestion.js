import mongoose from 'mongoose';
const schema=new mongoose.Schema({product:{type:mongoose.Schema.Types.ObjectId,ref:'Product',required:true},createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},status:{type:String,enum:['pending','approved','rejected'],default:'pending'},suggestedFields:{type:mongoose.Schema.Types.Mixed,required:true},sourceSignature:{type:String,required:true},provider:{type:String,default:'baseline'},reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},reviewedAt:Date,reviewNote:{type:String,default:''}},{timestamps:true});
schema.index({status:1,createdAt:-1});schema.index({product:1,createdAt:-1});
export default mongoose.model('AIAdminSuggestion',schema);
