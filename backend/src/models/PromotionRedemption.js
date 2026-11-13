import mongoose from 'mongoose';
const schema=new mongoose.Schema({promotion:{type:mongoose.Schema.Types.ObjectId,ref:'Promotion',required:true},user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},order:{type:mongoose.Schema.Types.ObjectId,ref:'Order',required:true}},{timestamps:true});
schema.index({promotion:1,user:1},{unique:true});schema.index({order:1},{unique:true});export default mongoose.model('PromotionRedemption',schema);
