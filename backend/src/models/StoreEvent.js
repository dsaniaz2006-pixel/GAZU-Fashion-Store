import mongoose from 'mongoose';
const schema=new mongoose.Schema({type:{type:String,required:true,enum:['product_view','search','cart_add','checkout_start','order_complete']},productId:{type:mongoose.Schema.Types.ObjectId,ref:'Product'}},{timestamps:true});
schema.index({createdAt:1},{expireAfterSeconds:60*60*24*90});schema.index({type:1,createdAt:-1});export default mongoose.model('StoreEvent',schema);
