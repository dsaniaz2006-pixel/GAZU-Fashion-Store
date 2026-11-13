import mongoose from 'mongoose';
const entry=new mongoose.Schema({by:{type:mongoose.Schema.Types.ObjectId,ref:'User'},role:{type:String,enum:['customer','staff'],required:true},message:{type:String,required:true,maxlength:1500},at:{type:Date,default:Date.now}},{_id:false});
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},order:{type:mongoose.Schema.Types.ObjectId,ref:'Order'},category:{type:String,enum:['delivery','return','product','payment','general'],required:true},subject:{type:String,required:true,maxlength:130},status:{type:String,enum:['open','in_progress','resolved'],default:'open'},messages:{type:[entry],default:[]},closedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'}},{timestamps:true});
schema.index({user:1,createdAt:-1});schema.index({status:1,createdAt:-1});
export default mongoose.model('SupportTicket',schema);
