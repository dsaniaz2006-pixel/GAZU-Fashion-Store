import{test,mock}from'node:test';import assert from'node:assert/strict';import Product from '../../src/models/Product.js';
import{embedProduct}from'../../src/services/ai/embeddings.js';import{createProvider}from'../../src/services/ai/modelProvider.js';
test('embedding job writes 768-dimensional model-identified fingerprint without altering price/quantity',async()=>{
 const product={_id:'507f1f77bcf86cd799439011',active:true,publicationStatus:'published',name:'Black Tee',type:'T-Shirts',category:'Men',description:'minimal',color:'Black',img:'photo-1521572163474-6864f9cf17ab',pricePaise:110000,quantity:8,styleTags:['minimal']};
 const stub=mock.method(Product,'updateOne',async()=>({modifiedCount:1}));
 try{await embedProduct(product,{provider:createProvider({provider:'mock'})});const change=stub.mock.calls[0].arguments[1].$set.aiEmbedding;assert.equal(change.values.length,768);assert.match(change.model,/mock:/);assert.equal(stub.mock.calls[0].arguments[1].$set.pricePaise,undefined);assert.equal(product.quantity,8);}finally{stub.mock.restore();}
});
