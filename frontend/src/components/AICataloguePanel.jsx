import React, {useState} from "react";
import {api} from "../api.js";
/** AI-assisted suggestions never change products until a staff member approves them. */
export default function AICataloguePanel({products=[]}){
 const [drafts,setDrafts]=useState([]),[jobs,setJobs]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[note,setNote]=useState('');
 async function refresh(){setBusy(true);setError('');try{const [d,j]=await Promise.all([api('/ai/drafts'),api('/ai/jobs')]);setDrafts(d);setJobs(j);}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function submit(productId,kind){setBusy(true);setError('');setNote('');try{await api(`/ai/products/${productId}/${kind}`,{method:'POST'});setNote(`${kind==='tag'?'Tag review':'Embedding'} job queued. Start the AI worker to process jobs.`);await refresh();}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function decide(id,action){setBusy(true);setError('');try{await api(`/ai/drafts/${id}`,{method:'PATCH',body:{action}});setNote(`Draft ${action==='approve'?'approved':'rejected'}. Refresh product list to see updates.`);await refresh();}catch(e){setError(e.message);}finally{setBusy(false);}}
 return <section className="gazu-ai-catalogue" aria-label="AI catalogue review" style={{marginBlock:'2rem',padding:'1rem',border:'1px solid currentColor'}}>
  <h2>AI CATALOGUE REVIEW</h2>
  <p>AI suggestions require approval. Product prices, stock, sizes and publication status are never changed by tagging.</p>
  <button type="button" className="btn" disabled={busy} onClick={refresh}>REFRESH AI JOBS & DRAFTS</button>
  {error&&<p role="alert" className="error-box">{error}</p>}{note&&<p role="status">{note}</p>}
  {jobs.length>0&&<p>Recent jobs: {jobs.slice(0,8).map(j=>`${j.kind}: ${j.state}`).join(' · ')}</p>}
  {drafts.length>0&&<div>{drafts.map(d=><article key={d._id} className="admin-product"><div><h3>{d.product?.name||'Unknown product'}</h3><p>Suggested tags: {(d.suggestion?.styleTags||[]).join(', ')||'None'} ({d.provider||'unknown'} provider)</p><p>Suggested category: {d.suggestion?.category||'Uncertain'} · Color: {d.suggestion?.color||'Uncertain'}</p><p>These fields are suggestions only. Approving adds style tags; it does not overwrite other attributes.</p><button type="button" className="btn dark" disabled={busy} onClick={()=>decide(d._id,'approve')}>APPROVE TAGS</button> <button type="button" className="btn" disabled={busy} onClick={()=>decide(d._id,'reject')}>REJECT</button></div></article>)}</div>}
  <details><summary>Queue AI work for products</summary><div>{products.slice(0,100).map(p=><div key={p.id||p._id} style={{padding:'0.4rem 0'}}><strong>{p.name}</strong>{' '}<button type="button" disabled={busy} onClick={()=>submit(p.id||p._id,'tag')}>Suggest tags</button>{' '}<button type="button" disabled={busy} onClick={()=>submit(p.id||p._id,'embed')}>Generate embedding</button></div>)}</div></details>
 </section>;
}
