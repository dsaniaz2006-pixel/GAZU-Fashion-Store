import AIQuota from '../../models/AIQuota.js';
import AIUsage from '../../models/AIUsage.js';
import {fail} from '../../utils/errors.js';
export function budgetWindow(date=new Date()){return new Date(date).toISOString().slice(0,10);}
const int=(v,def,min,max)=>{const n=Number(v);return Number.isSafeInteger(n)&&n>=min&&n<=max?n:def;};
export async function reserveAIRequest({actor,kind='chat',model='mock',maxInput=5000,limitOverride=null}) {
  const userId=actor?.id||'guest';const day=budgetWindow();const limit=limitOverride===null?int(process.env.GAZU_AI_USER_DAILY_REQUESTS,30,1,500):int(limitOverride,30,1,100000);
  const maxTokens=int(process.env.GAZU_AI_USER_DAILY_TOKENS,60000,1000,5000000);
  const tokens=Math.min(3500,Math.max(300,Math.ceil(maxInput/3)+600));
  const filter={actor:String(userId),day,requests:{$lt:limit},reservedTokens:{$lte:maxTokens-tokens}};
  const reservation=await AIQuota.findOneAndUpdate(filter,{$inc:{requests:1,reservedTokens:tokens}},{new:true});
  if(reservation)return {actor:String(userId),kind,day,model,maxInput};
  try{await AIQuota.create({actor:String(userId),day,requests:1,reservedTokens:tokens});return {actor:String(userId),kind,day,model,maxInput};}
  catch(error){if(error?.code!==11000)throw error;}
  fail(429,'Daily AI request allowance reached. Please try again tomorrow.');
}
export async function recordAIUsage(reservation,{inputTokens=0,outputTokens=0,status='success'}={}) {
  await AIUsage.create({...reservation,inputTokens:Math.max(0,inputTokens),outputTokens:Math.max(0,outputTokens),status});
}
