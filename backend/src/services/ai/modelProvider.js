// Server-only model gateway. No API keys or raw prompts appear in logs.
const GEMINI_ROOT='https://generativelanguage.googleapis.com/v1beta/models';
export class AIProviderError extends Error {constructor(message,status=503){super(message);this.status=status;this.name='AIProviderError';}}
export function safePrompt(text='') {
  if(typeof text!=='string'||text.length>5000)return false;
  return !/(ignore (all )?(previous|prior|system) instructions|reveal (the )?(system prompt|api key|secret)|developer message|bypass (safety|security)|you are now (a|the) system)/i.test(text);
}
const safeModel = (value,fallback)=>/^[a-zA-Z0-9._-]{3,80}$/.test(value||'')?value:fallback;
async function apiRequest(path,body,{key,timeoutMs=15000,fetchImpl=fetch}={}) {
  if(!key)throw new AIProviderError('AI provider is not configured.',503);
  const signal=AbortSignal.timeout(timeoutMs);let res;
  try {res=await fetchImpl(`${GEMINI_ROOT}/${path}`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(body),signal});}
  catch(e){throw new AIProviderError(e.name==='TimeoutError'?'AI request timed out.':'AI provider unavailable.',503);}
  if(!res.ok){if(res.status===429)throw new AIProviderError('AI request quota reached.',429);throw new AIProviderError('AI provider request failed.',503);}
  try{return await res.json();}catch{throw new AIProviderError('Invalid AI provider response.',503);}
}
const DEFAULT_GENERATION='gemini-2.5-flash';
const DEFAULT_EMBEDDING='gemini-embedding-2';
export function createProvider({provider=process.env.GAZU_AI_PROVIDER||'mock',key=process.env.GEMINI_API_KEY,fetchImpl=fetch,model=process.env.GAZU_AI_MODEL,embeddingModel=process.env.GAZU_AI_EMBEDDING_MODEL}={}) {
  if(!['mock','gemini'].includes(provider))throw new AIProviderError('Unknown AI provider',503);
  if(provider==='mock')return {
    name:'mock',
    async generateText({user}){return {text:`GAZU demo: ${String(user||'').slice(0,160)}`,inputTokens:0,outputTokens:0};},
    async *streamText({user}){for(const token of `GAZU demo: ${String(user||'').slice(0,160)}`.match(/.{1,40}/g)||[])yield token;},
    async generateJSON({user}){const text=String(user||'').toLowerCase();return {category:text.includes('shirt')?'Men':null,type:text.includes('tee')?'T-Shirts':null,color:text.includes('beige')?'Beige':null,styleTags:[...new Set(['minimal',...(text.includes('street')?['streetwear']:[])])],patterns:[],occasions:['casual'],description:'',altText:''};},
    async embedText({text,dimensions=768}){const values=Array(dimensions).fill(0);for(let i=0;i<text.length;i++){const j=(i*131+text.charCodeAt(i))%dimensions;values[j]+=1;}const len=Math.hypot(...values)||1;return values.map(x=>x/len);},
  };
  const genModel=safeModel(model,DEFAULT_GENERATION);const embModel=safeModel(embeddingModel,DEFAULT_EMBEDDING);
  return {name:'gemini',
    async *streamText({system,user,maxOutputTokens=512,signal}){
      if(!key)throw new AIProviderError('AI provider is not configured.',503);
      let response;
      try{response=await fetchImpl(`${GEMINI_ROOT}/${genModel}:streamGenerateContent?alt=sse`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({systemInstruction:{parts:[{text:String(system||'')}]},contents:[{role:'user',parts:[{text:String(user||'')}]}],generationConfig:{temperature:0.2,maxOutputTokens:Math.min(1024,Math.max(64,maxOutputTokens))}}),signal:signal||AbortSignal.timeout(30000)});}catch{throw new AIProviderError('AI stream unavailable.');}
      if(!response.ok||!response.body)throw new AIProviderError(response.status===429?'AI request quota reached.':'AI stream failed.',response.status===429?429:503);
      const decoder=new TextDecoder();let buffer='';
      for await(const chunk of response.body){buffer+=decoder.decode(chunk,{stream:true});
        let split;while((split=buffer.indexOf('\n\n'))>=0){const event=buffer.slice(0,split);buffer=buffer.slice(split+2);
          const payload=event.split(/\r?\n/).filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trim()).join('');
          if(!payload||payload==='[DONE]')continue;
          let json;try{json=JSON.parse(payload);}catch{continue;}
          const delta=json.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';
          if(delta)yield delta;
        }
      }
    },
    async generateText({system,user,maxOutputTokens=512}){
      const result=await apiRequest(`${genModel}:generateContent`,{systemInstruction:{parts:[{text:String(system||'')}]},contents:[{role:'user',parts:[{text:String(user||'') }]}],generationConfig:{temperature:0.2,maxOutputTokens:Math.min(1024,Math.max(64,maxOutputTokens))}},{key,fetchImpl});
      const text=result.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';
      if(!text)throw new AIProviderError('The AI provider returned no usable answer.');
      return {text,inputTokens:result.usageMetadata?.promptTokenCount||0,outputTokens:result.usageMetadata?.candidatesTokenCount||0};
    },
    async generateJSON({system,user,imagePart}) {
      const parts=[{text:String(user||'')}];if(imagePart)parts.push(imagePart);
      const result=await apiRequest(`${genModel}:generateContent`,{systemInstruction:{parts:[{text:String(system||'')}]},contents:[{role:'user',parts}],generationConfig:{temperature:0.1,responseMimeType:'application/json',maxOutputTokens:900}},{key,fetchImpl,timeoutMs:20000});
      const raw=result.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';
      try{return JSON.parse(raw);}catch{throw new AIProviderError('The model produced invalid structured data.');}
    },
    async embedText({text,dimensions=768,imagePart}){
      const parts=[{text:String(text)}];if(imagePart)parts.push(imagePart);
      const data=await apiRequest(`${embModel}:embedContent`,{model:`models/${embModel}`,content:{parts},outputDimensionality:dimensions},{key,fetchImpl,timeoutMs:20000});
      const values=data.embedding?.values;
      if(!Array.isArray(values)||values.length!==dimensions||values.some(x=>typeof x!=='number'||!Number.isFinite(x)))throw new AIProviderError('Invalid embedding dimensions from provider.');
      return values;
    },
  };
}
