import{test}from'node:test';import assert from'node:assert/strict';
import{createProvider}from'../../src/services/ai/modelProvider.js';
test('Gemini adapter sends bounded server-only request and parses usage',async()=>{
 const calls=[];const fetchImpl=async(url,opts)=>{calls.push({url,opts});return{ok:true,status:200,json:async()=>({candidates:[{content:{parts:[{text:'Try the black tee.'}]}}],usageMetadata:{promptTokenCount:24,candidatesTokenCount:8}})};};
 const provider=createProvider({provider:'gemini',key:'unit-test-key',fetchImpl,model:'gemini-2.5-flash'});
 const result=await provider.generateText({system:'Only catalogue items',user:'black tee',maxOutputTokens:600});
 assert.equal(result.text,'Try the black tee.');assert.equal(result.inputTokens,24);
 assert.equal(calls[0].opts.headers['x-goog-api-key'],'unit-test-key');assert.equal(JSON.parse(calls[0].opts.body).generationConfig.maxOutputTokens,600);
 assert.ok(calls[0].url.endsWith('gemini-2.5-flash:generateContent'));
});
test('Gemini embedding model returns validated dimensional vector',async()=>{
 const values=Array(768).fill(0.5);const calls=[];
 const provider=createProvider({provider:'gemini',key:'test',fetchImpl:async(url,opts)=>{calls.push(JSON.parse(opts.body));return{ok:true,status:200,json:async()=>({embedding:{values}})};}});
 const emb=await provider.embedText({text:'white cotton tee',dimensions:768});
 assert.equal(emb.length,768);assert.equal(calls[0].outputDimensionality,768);assert.equal(calls[0].content.parts[0].text,'white cotton tee');
});
test('Gemini SSE stream yields partial text without storing model prompt',async()=>{
 const data=`data: ${JSON.stringify({candidates:[{content:{parts:[{text:'Hello '}]}}]})}\n\n`+`data: ${JSON.stringify({candidates:[{content:{parts:[{text:'GAZU'}]}}]})}\n\n`;
 const provider=createProvider({provider:'gemini',key:'test',fetchImpl:async()=>({ok:true,status:200,body:(async function*(){yield Buffer.from(data.slice(0,25));yield Buffer.from(data.slice(25));})()})});
 const chunks=[];for await(const token of provider.streamText({system:'Only products',user:'Hello'}))chunks.push(token);
 assert.deepEqual(chunks,['Hello ','GAZU']);
});
