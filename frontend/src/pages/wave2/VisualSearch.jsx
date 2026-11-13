import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {Camera,Search} from 'lucide-react';
import {useAuth} from '../../context/AuthContext.jsx';
import {ErrorState} from '../../components/AsyncState.jsx';
import Wave2ProductCards from '../../components/wave2/Wave2ProductCards.jsx';
import GazuEditorialArrival from '../../components/editorial/GazuEditorialArrival.jsx';
import GazuEditNav from '../../components/editorial/GazuEditNav.jsx';
export default function VisualSearch(){
 const {user}=useAuth();const [file,setFile]=useState(null),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const search=async e=>{e.preventDefault();if(!file||busy)return;setBusy(true);setError('');setResult(null);try{
 const body=new FormData();body.append('image',file);
 const token=sessionStorage.getItem('gazu-token');
 const res=await fetch((import.meta.env.VITE_API_URL||'/api')+'/wave2/visual-search',{method:'POST',headers:token?{Authorization:`Bearer ${token}`}:{},body});
 const json=await res.json().catch(()=>({message:'Image search unavailable.'}));if(!res.ok)throw new Error(json.message||'Image search failed.');setResult(json);
 }catch(err){setError(err.message);}finally{setBusy(false);}};
 return <main className="gazu-editorial-page"><GazuEditorialArrival kicker="GAZU / VISUAL DISCOVERY" title="FIND IT BY IMAGE" description="Upload a photo of a garment and discover related GAZU pieces." actionLabel="SEARCH WITH AN IMAGE" onAction={()=>document.getElementById('gazu-visual')?.scrollIntoView({behavior:'smooth'})}/><GazuEditNav/>
 <section id="gazu-visual" className="gazu-editorial-content"><div className="gazu-editorial-section-top"><span>08 / VISUAL SEARCH</span><span>FROM INSPIRATION TO THE EDIT.</span></div><h2>SEE IT. <em>FIND IT.</em></h2><p className="gazu-wave2-muted">Uploads are sent to Gemini for recognition. GAZU does not retain the original image. Avoid photos containing private information.</p>
 {!user?<p>Sign in to search safely using an image. <Link to="/account">SIGN IN</Link></p>:<form onSubmit={search} className="gazu-wave2-form"><label htmlFor="gazu-photo">Garment photograph (JPEG, PNG, WebP — max 3 MB)</label><input id="gazu-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const choice=e.target.files?.[0];setFile(choice||null);setResult(null);setError(choice&&choice.size>3000000?'The image must be smaller than 3 MB.':'');}}/>{file&&<p>{file.name}</p>}<button type="submit" disabled={busy||!file||file.size>3000000}><Camera size={16}/>{busy?'MATCHING...':'FIND SIMILAR PIECES'}</button></form>}
 {error&&<ErrorState message={error}/>} {result&&<><p className="gazu-wave2-muted">Detected: {[result.description.color,result.description.garment,result.description.style].filter(Boolean).join(' · ')||'Unknown garment'}. Results are suggestions, not exact product matches. Your image is sent to the configured Gemini service for analysis but is not saved by GAZU.</p><Wave2ProductCards items={result.items} prefix="VISUAL MATCH"/></>}
 </section></main>;
}
