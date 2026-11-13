import{test}from'node:test';import assert from'node:assert/strict';import{readFileSync,existsSync,readdirSync}from'node:fs';import{dirname,join,resolve,extname}from'node:path';
const root=new URL('../',import.meta.url).pathname;function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(ent=>ent.isDirectory()?ent.name==='node_modules'?[]:walk(join(dir,ent.name)):/\.[cm]?[jt]sx?$/.test(ent.name)?[join(dir,ent.name)]:[])}
test('frontend and backend relative module imports resolve to real files',()=>{
 const files=[...walk(join(root,'backend/src')),...walk(join(root,'frontend/src'))];let checked=0;
 for(const file of files){const text=readFileSync(file,'utf8');for(const match of text.matchAll(/(?:from\s*|import\s*|import\s*\()\s*['"](\.[^'"]+)['"]/g)){
 const stem=resolve(dirname(file),match[1]);const candidates=[stem,stem+'.js',stem+'.jsx',stem+'.mjs',stem+'.ts',stem+'.tsx',stem+'.css',stem+'.json',join(stem,'index.js')];
 assert.ok(candidates.some(existsSync),`${file} imports missing ${match[1]}`);checked++;
 }}
 assert.ok(checked>50,`Too few imports checked: ${checked}`);
});
