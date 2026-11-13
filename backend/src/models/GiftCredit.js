import mongoose from 'mongoose';
const schema=new mongoose.Schema({codeHash:{type:String,required:true,unique:true,select:false},balancePaise:{type:Number,required:true,min:0},initialPaise:{type:Number,required:true,min:1},active:{type:Boolean,default:true},issuedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},expiresAt:{type:Date}},{timestamps:true});
export default mongoose.model('GiftCredit',schema);
