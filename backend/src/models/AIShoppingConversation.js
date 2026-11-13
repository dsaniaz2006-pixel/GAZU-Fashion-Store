import mongoose from 'mongoose';
const messageSchema=new mongoose.Schema({role:{type:String,enum:['user','assistant'],required:true},text:{type:String,required:true,maxlength:2400},productIds:{type:[String],default:[]},at:{type:Date,default:Date.now}},{_id:false});
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},title:{type:String,default:'Shopping conversation',maxlength:90},messages:{type:[messageSchema],default:[]},expiresAt:{type:Date,default:()=>new Date(Date.now()+30*86400000)}},{timestamps:true});
schema.index({expiresAt:1},{expireAfterSeconds:0});
schema.index({user:1,updatedAt:-1});
export default mongoose.model('AIShoppingConversation',schema);
