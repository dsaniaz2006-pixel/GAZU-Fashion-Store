import mongoose from 'mongoose';
const schema=new mongoose.Schema({card:{type:mongoose.Schema.Types.ObjectId,ref:'GiftCredit',required:true},user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},order:{type:mongoose.Schema.Types.ObjectId,ref:'Order',required:true},amountPaise:{type:Number,required:true,min:1}},{timestamps:true});
schema.index({order:1},{unique:true});export default mongoose.model('GiftCreditUse',schema);
