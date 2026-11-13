import mongoose from 'mongoose';
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},order:{type:mongoose.Schema.Types.ObjectId,ref:'Order',required:true,unique:true},points:{type:Number,min:0,required:true},reason:{type:String,default:'delivered-order'}},{timestamps:true});
export default mongoose.model('LoyaltyEntry',schema);
