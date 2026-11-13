import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useFetch } from "../hooks/useFetch.js";
import { toProduct } from "../api.js";
import { image, money } from "../format.js";
import { curateLook } from "../lib/curation.mjs";
import { LoadingState, ErrorState, EmptyState } from "../components/AsyncState.jsx";
import GazuEditorialArrival from "../components/editorial/GazuEditorialArrival.jsx";
import GazuEditNav from "../components/editorial/GazuEditNav.jsx";
import DressLikeSection from "../components/dress-like/DressLikeSection.jsx";
import { api } from "../api.js";
import Wave2ProductCards from "../components/wave2/Wave2ProductCards.jsx";

export default function Lookbook() {
  const navigate = useNavigate();
  const [outfitStyle,setOutfitStyle]=useState('heritage');
  const [outfitCategory,setOutfitCategory]=useState('Men');
  const [budget,setBudget]=useState(10000);
  const [anchor,setAnchor]=useState('');
  const [outfit,setOutfit]=useState(null);
  const [outfitBusy,setOutfitBusy]=useState(false);
  const [outfitError,setOutfitError]=useState('');
  const build=async event=>{event.preventDefault();setOutfitBusy(true);setOutfitError('');setOutfit(null);
    try{setOutfit(await api('/wave2/outfits',{method:'POST',body:{style:outfitStyle,category:outfitCategory,budgetRupees:Number(budget),...(anchor?{anchorId:anchor}:{})}}));}
    catch(e){setOutfitError(e.message);}finally{setOutfitBusy(false);}
  };
  const { data, loading, error, reload } = useFetch("/products?category=Men&limit=50&sort=featured");
  const look = curateLook((data?.items || []).map(toProduct));
  return (
    <main className="gazu-editorial-page">
      <GazuEditorialArrival kicker="GAZU / THE HERITAGE EDIT" title="SHOP THE LOOK"
        description="Considered pieces. Personal combinations. An invitation to dress your way."
        actionLabel="EXPLORE THE EDIT" onAction={() => document.getElementById("gazu-curated-pieces")?.scrollIntoView({ behavior: "smooth" })} />
      <GazuEditNav />
      <section id="gazu-curated-pieces" className="gazu-editorial-content" aria-labelledby="gazu-lookbook-heading">
        <div className="gazu-editorial-section-top"><span>01 / THE CONSIDERED EDIT</span><span>PERSONAL STYLE, UNCOMPROMISED.</span></div>
        <div className="gazu-editorial-title-row">
          <div><p className="gazu-editorial-kicker">AN OUTFIT, YOUR POINT OF VIEW</p><h2 id="gazu-lookbook-heading">THE <em>HERITAGE</em> EDIT</h2></div>
          <p>Classic combinations curated from actual available pieces. Open any item to choose a size or inspect availability.</p>
        </div>
        {loading ? <LoadingState>Curating your look...</LoadingState>
          : error ? <ErrorState message={error} retry={reload} />
          : look.length ? <div className="gazu-editorial-products">{look.map((p, i) => (
            <Link className="gazu-editorial-product" key={p.id} to={`/product/${p.id}`}>
              <div className="gazu-editorial-product-media"><img loading="lazy" src={image(p.img, 900)} alt={p.name} /><span>LOOK / {String(i + 1).padStart(2, "0")}</span></div>
              <div className="gazu-editorial-product-meta"><div><h3>{p.name}</h3><p>{money(p.price)}</p></div><ArrowUpRight aria-hidden="true" size={18}/></div>
            </Link>
          ))}</div> : <EmptyState>No available matching looks yet.</EmptyState>}
        <p className="gazu-editorial-note">A good look is built one piece at a time. Prices and availability are checked on each product page. This is a curated selection, not a preconfigured outfit bundle.</p>
      </section>
      <section className="gazu-editorial-content" aria-labelledby="gazu-wave2-outfit-heading">
        <div className="gazu-editorial-section-top"><span>06 / AI OUTFIT BUILDER</span><span>REAL PIECES. NO INVENTED BUNDLES.</span></div>
        <h2 id="gazu-wave2-outfit-heading">BUILD THE <em>LOOK.</em></h2>
        <form className="gazu-wave2-form" onSubmit={build}>
          <label>Your style<select value={outfitStyle} onChange={e=>setOutfitStyle(e.target.value)}>{['heritage','minimal','street','active'].map(s=><option key={s}>{s}</option>)}</select></label>
          <label>Department<select value={outfitCategory} onChange={e=>setOutfitCategory(e.target.value)}>{['Men','Women','Kids'].map(s=><option key={s}>{s}</option>)}</select></label>
          <label>Start with an item<select value={anchor} onChange={e=>setAnchor(e.target.value)}><option value="">SURPRISE ME</option>{look.filter(p=>/^[a-f0-9]{24}$/i.test(p.id||'')).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label>Total look budget (₹)<input type="number" min="300" max="250000" step="100" value={budget} onChange={e=>setBudget(e.target.value)}/></label>
          <button type="submit" disabled={outfitBusy}>{outfitBusy?'BUILDING...':'BUILD MY OUTFIT'}</button>
        </form>
        {outfitError&&<ErrorState message={outfitError}/>}
        {outfit&&<><p className="gazu-wave2-muted" role="status">{outfit.complete?'Complete outfit assembled.':'Partial look — catalogue pieces are unavailable for some slots.'} {outfit.mode==='ai-assisted'?'Gemini-assisted selection.':'Catalogue-based selection.'} Total: {money(outfit.totalPricePaise/100)}. {outfit.missingSlots.length?`Missing: ${outfit.missingSlots.join(', ')}.`:''} Choose sizes and add pieces individually.</p><Wave2ProductCards items={outfit.items} prefix="OUTFIT"/></>}
      </section>
      <DressLikeSection onExplore={() => navigate("/shop?category=Men")} />
    </main>
  );
}
