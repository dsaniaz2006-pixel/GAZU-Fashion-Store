import React from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext.jsx';
import {useFetch} from '../../hooks/useFetch.js';
import {LoadingState,ErrorState} from '../../components/AsyncState.jsx';
import Wave2ProductCards from '../../components/wave2/Wave2ProductCards.jsx';
import GazuEditorialArrival from '../../components/editorial/GazuEditorialArrival.jsx';
import GazuEditNav from '../../components/editorial/GazuEditNav.jsx';
export default function Discovery(){const {user}=useAuth();const {data,loading,error,reload}=useFetch(user?'/wave2/recommendations?limit=12':null,0,user?.id||'guest');
 return <main className="gazu-editorial-page"><GazuEditorialArrival kicker="GAZU / DISCOVERY" title="DISCOVER YOUR EDIT" description="A personal collection informed by your saved styles and favourite pieces." actionLabel="EXPLORE RECOMMENDATIONS" onAction={()=>document.getElementById('gazu-discovery')?.scrollIntoView({behavior:'smooth'})}/><GazuEditNav/>
 <section id="gazu-discovery" className="gazu-editorial-content"><div className="gazu-editorial-section-top"><span>09 / YOUR DISCOVERY</span><span>STYLE OVER ALGORITHMIC NOISE.</span></div><h2>CURATED <em>FOR YOU.</em></h2>
 {!user?<p>Sign in to see recommendations based only on your saved wishlist and style preference. <Link to="/account">SIGN IN</Link></p>:loading?<LoadingState>Finding your edit...</LoadingState>:error?<ErrorState message={error} retry={reload}/>:<><p className="gazu-wave2-muted">{data?.personalized?'Inspired by your wishlist and preferred style.':'A discovery edit based on your chosen style. Save favourites to tailor future suggestions.'} No products are purchased or saved automatically.</p><Wave2ProductCards items={data?.items||[]} prefix="DISCOVERY"/><Link to="/account/profile">UPDATE YOUR STYLE PREFERENCES</Link></>}
 </section></main>;
}
