import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import Wave2ProductCards from "../components/wave2/Wave2ProductCards.jsx";
import { ArrowUpRight } from "lucide-react";
import { useFetch } from "../hooks/useFetch.js";
import { toProduct } from "../api.js";
import { image, money } from "../format.js";
import { styleQuizResults } from "../lib/curation.mjs";
import { LoadingState, ErrorState, EmptyState } from "../components/AsyncState.jsx";
import GazuEditorialArrival from "../components/editorial/GazuEditorialArrival.jsx";
import GazuEditNav from "../components/editorial/GazuEditNav.jsx";

const STYLES = [
  { value: "heritage", label: "HERITAGE", subtitle: "Old Money / Timeless" },
  { value: "minimal", label: "MINIMAL", subtitle: "Quiet Luxury / Everyday" },
  { value: "street", label: "STREET", subtitle: "Urban / Relaxed" },
  { value: "active", label: "ACTIVE", subtitle: "Athletic / Off Duty" },
];
export default function StyleFinder() {
  const [style, setStyle] = useState("heritage");
  const [occasion,setOccasion]=useState('everyday');
  const [category,setCategory]=useState('Men');
  const [color,setColor]=useState('');
  const [budget,setBudget]=useState(5000);
  const [aiEdit,setAiEdit]=useState(null);
  const [aiError,setAiError]=useState('');
  const [aiBusy,setAiBusy]=useState(false);
  const findAI=async event=>{
    event.preventDefault();setAiBusy(true);setAiError('');setAiEdit(null);
    try{setAiEdit(await api('/wave2/stylist',{method:'POST',body:{style,occasion,category,...(color?{color}:{}),budgetRupees:Number(budget)}}));}
    catch(e){setAiError(e.message);}finally{setAiBusy(false);}
  };
  const { data, loading, error, reload } = useFetch("/products?category=Men&limit=50");
  const items = styleQuizResults((data?.items || []).map(toProduct), style);
  return (
    <main className="gazu-editorial-page">
      <GazuEditorialArrival kicker="GAZU / PERSONAL EDIT" title="FIND YOUR STYLE"
        description="An edit built around the way you dress, not the trend of the moment."
        actionLabel="DISCOVER YOUR EDIT" onAction={() => document.getElementById("gazu-style-choices")?.scrollIntoView({ behavior: "smooth" })}/>
      <GazuEditNav />
      <section className="gazu-editorial-content" id="gazu-style-choices" aria-labelledby="gazu-style-heading">
        <div className="gazu-editorial-section-top"><span>02 / YOUR PERSONAL EDIT</span><span>LESS, BUT BETTER.</span></div>
        <div className="gazu-editorial-title-row"><div><p className="gazu-editorial-kicker">CHOOSE A DIRECTION</p><h2 id="gazu-style-heading">YOUR <em>SIGNATURE</em></h2></div><p>Choose one of four styling directions to see matching pieces from the real catalogue. No AI profiling or fabricated recommendations.</p></div>
        <div className="gazu-style-selections" role="group" aria-label="Choose your style">
          {STYLES.map(s => <button type="button" key={s.value} className="gazu-style-option" aria-pressed={style === s.value} onClick={() => setStyle(s.value)}>
            <span>{s.label}</span><small>{s.subtitle}</small><ArrowUpRight size={16} aria-hidden="true" />
          </button>)}
        </div>
        <p className="gazu-editorial-kicker">SELECTED FOR YOU / {STYLES.find(s => s.value === style)?.label}</p>
        {loading ? <LoadingState>Loading suggestions...</LoadingState>
          : error ? <ErrorState message={error} retry={reload} />
          : items.length ? <div className="gazu-editorial-products">{items.map((p, i) => <Link key={p.id} className="gazu-editorial-product" to={`/product/${p.id}`}>
            <div className="gazu-editorial-product-media"><img src={image(p.img, 900)} alt={p.name} loading="lazy"/><span>THE EDIT / {String(i+1).padStart(2,"0")}</span></div>
            <div className="gazu-editorial-product-meta"><div><h3>{p.name}</h3><p>{money(p.price)}</p></div><ArrowUpRight size={18} aria-hidden="true"/></div>
          </Link>)}</div> : <EmptyState>Nothing currently matches this style. Try another.</EmptyState>}
      </section>
      <section className="gazu-editorial-content" aria-labelledby="gazu-wave2-style-heading">
        <div className="gazu-editorial-section-top"><span>05 / AI FASHION STYLIST</span><span>YOUR STYLE, REAL INVENTORY.</span></div>
        <h2 id="gazu-wave2-style-heading">FIND YOUR <em>EDIT.</em></h2>
        <p className="gazu-wave2-muted">Choose an occasion and budget. GAZU only recommends items actually listed and available in the catalogue.</p>
        <form className="gazu-wave2-form" onSubmit={findAI}>
          <label>Occasion<select value={occasion} onChange={e=>setOccasion(e.target.value)}>{['everyday','work','weekend','evening','travel','sport'].map(v=><option value={v} key={v}>{v.toUpperCase()}</option>)}</select></label>
          <label>Department<select value={category} onChange={e=>setCategory(e.target.value)}>{['Men','Women','Kids','Accessories'].map(v=><option key={v}>{v}</option>)}</select></label>
          <label>Color<select value={color} onChange={e=>setColor(e.target.value)}><option value="">ANY COLOR</option>{['black','white','beige','blue','navy','grey','brown','red','green','pink','cream','olive'].map(v=><option key={v}>{v}</option>)}</select></label>
          <label>Budget (₹)<input type="number" min="300" max="250000" step="100" value={budget} onChange={e=>setBudget(e.target.value)}/></label>
          <button type="submit" disabled={aiBusy}>{aiBusy?'CURATING...':'ASK GAZU STYLIST'}</button>
        </form>
        {aiError&&<ErrorState message={aiError}/>} {aiEdit&&<><p className="gazu-wave2-muted" role="status">{aiEdit.summary} {aiEdit.mode==='ai-assisted'?'AI-assisted styling.':'Catalogue-based styling.'}</p><Wave2ProductCards items={aiEdit.items} prefix="STYLE EDIT"/></>}
      </section>
    </main>
  );
}
