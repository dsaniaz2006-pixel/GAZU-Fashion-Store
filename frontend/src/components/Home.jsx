import React, { useEffect, useRef } from "react";
import { ArrowUpRight, Heart, PackageCheck, ShieldCheck, ShoppingBag, Sparkles, UserRound } from "lucide-react";
import { useStorefront } from "../context/StorefrontContext.jsx";
import { useOutletContext } from "react-router-dom";
import CinematicModelHero from "./brand/CinematicModelHero.jsx";
import FashionCategorySection from "./categories/FashionCategorySection.jsx";
import ThisSummerSection from "./summer/ThisSummerSection.jsx";
import DressLikeSection from "./dress-like/DressLikeSection.jsx";
import { image } from "../format.js";
import ProductGrid from "./ProductGrid.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { toProduct } from "../api.js";
import { LoadingState, ErrorState, EmptyState } from "./AsyncState.jsx";
import Benefits from "./Benefits.jsx";

const benefits = [
  { Icon: Heart, title: "SAVE WHAT YOU LOVE", desc: "Keep your favourite finds together." },
  { Icon: PackageCheck, title: "YOUR ORDERS", desc: "See every order in one place." },
  { Icon: ShoppingBag, title: "A SIMPLER BAG", desc: "Pick up where you left off." },
  { Icon: ShieldCheck, title: "YOUR OWN SPACE", desc: "An account designed around you." },
];

export default function Home() {
  const { version, go } = useStorefront();
  const { data, loading, error, reload } = useFetch("/products?limit=4", version);
  const products = (data?.items || []).map(toProduct);
  const cinematicHeroRef = useRef(null);
  const { introActive = false, registerHeroReveal } = useOutletContext() || {};

  // The hero is mounted under the Phase 1 overlay. Registration lets the
  // Phase 1 timeline start Phase 2 while the white overlay fades away.
  useEffect(() => registerHeroReveal?.(() => cinematicHeroRef.current?.reveal()), [registerHeroReveal]);

  const openCollection = (category = "All") => go("shop", category);

  return (
    <main className="ns-home">
      <CinematicModelHero
        ref={cinematicHeroRef}
        awaitingIntro={introActive}
        onShop={() => openCollection("All")}
      />

      <div className="ns-intro-line" aria-label="GAZU brand philosophy">
        <span>PERSONAL STYLE, UNCOMPROMISED.</span>
        <span className="ns-intro-star" aria-hidden="true">✳</span>
        <span>THE ART OF EVERYDAY DRESSING.</span>
        <span className="ns-intro-star" aria-hidden="true">✳</span>
        <span>LESS, BUT BETTER.</span>
      </div>

      <ThisSummerSection onExplore={() => openCollection("All")} />

      <DressLikeSection onExplore={() => openCollection("All")} />

      <FashionCategorySection />

      <section className="ns-members" aria-labelledby="ns-members-title">
        <div className="ns-members-info">
          <p className="ns-small-kicker">A LITTLE MORE PERSONAL</p>
          <h2 id="ns-members-title">THE GAZU<br /><em>MEMBERS CLUB</em></h2>
          <p className="ns-members-lead">The little things that make shopping feel like yours.</p>
          <div className="ns-member-perks">
            {benefits.map(({ Icon, title, desc }) => (
              <div className="ns-perk" key={title}><Icon size={22} strokeWidth={1.3} aria-hidden="true" /><b>{title}</b><span>{desc}</span></div>
            ))}
          </div>
          <button className="ns-pill ns-pill-outline" onClick={() => go("account")}><UserRound size={15} /> Your account <ArrowUpRight size={15} /></button>
        </div>
        <div className="ns-members-photo"><img src={image("photo-1483985988355-763728e1935b", 1100)} loading="lazy" alt="Editorial fashion styling with shopping bags" /></div>
      </section>

      <section className="ns-products section products-section" aria-labelledby="ns-products-title">
        <div className="ns-section-top"><span>03 / WHAT WE LOVE</span><span>THE CONSIDERED EDIT</span></div>
        <div className="section-heading">
          <div><p className="ns-small-kicker">SMALL DETAILS, BIG IMPACT</p><h2 id="ns-products-title">BEST OF GAZU</h2></div>
          <button className="ns-text-link" onClick={() => openCollection("All")}>VIEW ALL PRODUCTS <ArrowUpRight size={16} /></button>
        </div>
        {loading ? <LoadingState>Loading products...</LoadingState>
          : error ? <ErrorState message={error} retry={reload} />
          : products.length ? <ProductGrid products={products} className="home-grid" />
          : <EmptyState>No products available yet.</EmptyState>}
      </section>

      <Benefits />
      <section className="ns-closing" aria-label="Our philosophy">
        <Sparkles size={17} strokeWidth={1.2} aria-hidden="true" />
        <span>GOOD STYLE ISN'T LOUD.</span>
        <h2>IT'S THE WAY YOU <em>FEEL.</em></h2>
        <button onClick={() => go("about")}>THE GAZU STORY <ArrowUpRight size={15} /></button>
      </section>
    </main>
  );
}
