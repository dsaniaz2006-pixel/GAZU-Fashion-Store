import mongoose from 'mongoose';
const schema=new mongoose.Schema({code:{type:String,required:true,unique:true,uppercase:true,trim:true},kind:{type:String,enum:['percent','fixed'],required:true},value:{type:Number,required:true,min:1},minimumPaise:{type:Number,default:0,min:0},maxRedemptions:{type:Number,required:true,min:1},redeemedCount:{type:Number,default:0,min:0},startAt:{type:Date,required:true},endAt:{type:Date,required:true},active:{type:Boolean,default:true}},{timestamps:true});
export default mongoose.model('Promotion',schema);
