import mongoose from 'mongoose';
const schema=new mongoose.Schema({actor:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},product:{type:mongoose.Schema.Types.ObjectId,ref:'Product',required:true},action:{type:String,enum:['create','update','variants','publication','archive'],required:true},before:mongoose.Schema.Types.Mixed,after:mongoose.Schema.Types.Mixed},{timestamps:true});
schema.index({product:1,createdAt:-1});export default mongoose.model('InventoryEvent',schema);
