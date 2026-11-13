import {createHash} from 'node:crypto';
import {createProvider} from './modelProvider.js';
import Product from '../../models/Product.js';
import {localProductImage} from './localImage.js';
const EMBEDDING_DIMS=768;
export const INDEX_NAME='gazu_product_vector_v1';
export function productEmbeddingText(p){return [p.name,p.category,p.type,p.color,p.description,...(p.styleTags||[])].filter(Boolean).map(String).join(' | ').slice(0,4000);}
export function embeddingFingerprint(product){return createHash('sha256').update(productEmbeddingText(product)+'|'+String(product.img||'')).digest('hex');}
export function vectorIndexDefinition(dimensions=EMBEDDING_DIMS){
 if(![768,1536,3072].includes(dimensions))throw Error('Unsupported embedding dimensions');
 return {fields:[{type:'vector',path:'aiEmbedding.values',numDimensions:dimensions,similarity:'cosine'},...['active','publicationStatus','category','type','pricePaise','inStock','quantity','color'].map(path=>({type:'filter',path}))]};
}
export async function embedProduct(product,{provider=createProvider(),includeImage=true}={}){
 if(!product.active|| !['published',undefined].includes(product.publicationStatus))throw Error('Only active published products may be embedded');
 const fingerprint=embeddingFingerprint(product);
 const modelTag=`${provider.name}:${process.env.GAZU_AI_EMBEDDING_MODEL||'gemini-embedding-2'}`;
 if(product.aiEmbedding?.fingerprint===fingerprint&&product.aiEmbedding?.model===modelTag&&product.aiEmbedding?.values?.length===EMBEDDING_DIMS)return product;
 const imagePart=includeImage?await localProductImage(product.img):null;
 const values=await provider.embedText({text:productEmbeddingText(product),dimensions:EMBEDDING_DIMS,imagePart});
 if(!Array.isArray(values)||values.length!==EMBEDDING_DIMS||values.some(x=>!Number.isFinite(x)))throw Error('Embedding vector invalid');
 await Product.updateOne({_id:product._id,active:true},{$set:{aiEmbedding:{values,model:modelTag,fingerprint,indexedAt:new Date()}}});
 return product;
}
export async function createAtlasIndex({confirm=false}={}){
 if(!confirm)throw Error('Explicit --confirm required to create Atlas index');
 const indexes=await Product.collection.listSearchIndexes().toArray();
 if(indexes.some(x=>x.name===INDEX_NAME))return {alreadyExists:true,name:INDEX_NAME};
 return Product.collection.createSearchIndex({name:INDEX_NAME,type:'vectorSearch',definition:vectorIndexDefinition(EMBEDDING_DIMS)});
}
