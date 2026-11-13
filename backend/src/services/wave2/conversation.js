import {safeCatalog,publicProduct,itemId} from './catalogue.js';
export function safeChatMessage(value){const v=String(value||'').trim();if(v.length<2||v.length>700)throw new TypeError('Chat message must be 2–700 characters.');return v;}
export function boundedConversation(messages=[],limit=10){return messages.slice(-Math.min(10,Math.max(1,limit))).filter(x=>['user','assistant'].includes(x.role)).map(x=>({role:x.role,text:String(x.text||'').slice(0,650)}));}
export function groundedConversationProducts(found=[]){return safeCatalog(found).slice(0,6).map(publicProduct).map(p=>({id:p._id,name:p.name,pricePaise:p.pricePaise,quantity:p.quantity,category:p.category}));}
export function ownsConversation(conversation,userId){return Boolean(conversation&&String(conversation.user)===String(userId));}
export function updateConversation(messages=[],question,answer,productIds=[]){const q=safeChatMessage(question);const a=String(answer||'').slice(0,2400);return [...messages,{role:'user',text:q},{role:'assistant',text:a,productIds:[...new Set(productIds.map(String))].slice(0,6)}].slice(-12);}
