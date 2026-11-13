import React from "react";
import { ArrowRight } from "lucide-react";
import { useStorefront } from "../context/StorefrontContext.jsx";
import { image } from "../format.js";
import ContentPage from "./ContentPage.jsx";
export default function About() {
  const { go } = useStorefront();
  return (
    <>
      <section className="about-hero">
        <img
          src={image("photo-1529139574466-a303027c1d8b", 1600)}
          alt="GAZU editorial"
        />
        <div>
          <p className="eyebrow">OUR PHILOSOPHY</p>
          <h1>
            LESS, BUT
            <br />
            <i>BETTER.</i>
          </h1>
        </div>
      </section>
      <ContentPage
        title="MADE FOR REAL LIFE."
        sub="We believe the best wardrobe is the one you reach for every day."
      >
        <div className="about-copy">
          <p>
            GAZU is built around thoughtful essentials: considered shapes,
            versatile colours, and pieces that work hard without asking for
            attention. We favour clarity over clutter and quality over excess.
          </p>
          <p>
            Our point of view is simple. Style should move with you, feel like
            you, and last beyond a season.
          </p>
          <button className="btn dark" onClick={() => go("shop", "All")}>
            SHOP THE EDIT <ArrowRight size={15} />
          </button>
        </div>
      </ContentPage>
    </>
  );
}
