import mongoose from 'mongoose';
const schema=new mongoose.Schema({kind:{type:String,enum:['tag','embed'],required:true},product:{type:mongoose.Schema.Types.ObjectId,ref:'Product',required:true},state:{type:String,enum:['queued','running','done','failed'],default:'queued'},attempts:{type:Number,default:0},runAfter:{type:Date,default:Date.now},leaseUntil:Date,result:mongoose.Schema.Types.Mixed,errorCode:String,actor:{type:mongoose.Schema.Types.ObjectId,ref:'User'}},{timestamps:true});
schema.index({state:1,runAfter:1,createdAt:1});
export default mongoose.model('AIJob',schema);
