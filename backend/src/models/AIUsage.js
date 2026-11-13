import mongoose from 'mongoose';
const schema=new mongoose.Schema({actor:{type:String,required:true},day:String,kind:String,model:String,inputTokens:{type:Number,default:0},outputTokens:{type:Number,default:0},status:{type:String,enum:['success','failed'],default:'success'}},{timestamps:true});
schema.index({createdAt:-1});
schema.index({actor:1,createdAt:-1});
export default mongoose.model('AIUsage',schema);
