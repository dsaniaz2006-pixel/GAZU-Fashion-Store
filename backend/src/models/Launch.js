import mongoose from 'mongoose';
const schema=new mongoose.Schema({title:{type:String,required:true},description:{type:String,default:''},slug:{type:String,required:true,unique:true},startsAt:{type:Date,required:true},endsAt:{type:Date,required:true},visible:{type:Boolean,default:true},link:{type:String,default:'/shop'}},{timestamps:true});
export default mongoose.model('Launch',schema);
