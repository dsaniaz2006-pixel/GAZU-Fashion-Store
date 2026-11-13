import mongoose from 'mongoose';
const schema=new mongoose.Schema({actor:{type:String,required:true},day:{type:String,required:true},requests:{type:Number,default:0,min:0},reservedTokens:{type:Number,default:0,min:0}},{timestamps:true});
schema.index({actor:1,day:1},{unique:true});
export default mongoose.model('AIQuota',schema);
