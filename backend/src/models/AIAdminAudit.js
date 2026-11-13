import mongoose from 'mongoose';
const schema=new mongoose.Schema({actor:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},product:{type:mongoose.Schema.Types.ObjectId,ref:'Product',required:true},suggestion:{type:mongoose.Schema.Types.ObjectId,ref:'AIAdminSuggestion',required:true},action:{type:String,enum:['approved','rejected'],required:true},before:{type:mongoose.Schema.Types.Mixed},after:{type:mongoose.Schema.Types.Mixed}},{timestamps:true});
schema.index({createdAt:-1});export default mongoose.model('AIAdminAudit',schema);
