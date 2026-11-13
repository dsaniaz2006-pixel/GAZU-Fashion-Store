import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Heart, ShoppingBag } from "lucide-react";
import { useStorefront } from "../../context/StorefrontContext.jsx";
import { image, money } from "../../format.js";
import InteractiveHoverButton from "./interactive-hover-button.jsx";
import "./skincare-product-shelf.css";

// GAZU adaptation of the 21st.dev shelf interaction. This uses the live product
// list instead of demo cosmetics or fictional product variants.
export function ProductShelf({ products = [] }) {
  const [selectedId, setSelectedId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");
  const closeRef = useRef(null);
  const { addToCart, wishlist, toggleWish, user } = useStorefront();
  const selected = products.find((p) => p.id === selectedId) || null;

  useEffect(() => {
    if (selected) closeRef.current?.focus();
  }, [selectedId]);

  useEffect(() => {
    if (!selected) return;
    function onKeyDown(event) {
      if (event.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  useEffect(() => {
    if (!products.some((p) => p.id === selectedId)) setSelectedId(null);
  }, [products, selectedId]);

  async function addOne(product) {
    if (!product.available || adding) return;
    if (!user) {
      await addToCart(product); // Existing storefront redirects guests to sign-in.
      return;
    }
    setAdding(true);
    setNotice("");
    try {
      await addToCart(product);
      // StorefrontContext shows the real cart success or error through its toast.
    } catch (error) {
      setNotice(error.message || "Unable to add this item.");
    } finally {
      setAdding(false);
    }
  }

  const rows = [];
  for (let start = 0; start < products.length; start += 4) rows.push(products.slice(start, start + 4));

  return (
    <section className="gazu-shelf" aria-label="GAZU product shelf">
      <div className="gazu-shelf-heading">
        <div>
          <span className="gazu-shelf-overline">THE GAZU EDIT</span>
          <h2>Find your everyday essential.</h2>
        </div>
        <span className="gazu-shelf-count">{products.length} {products.length === 1 ? "piece" : "pieces"} on display</span>
      </div>
      {selected ? (
        <div className="gazu-shelf-focus" key={selected.id}>
          <div className="gazu-shelf-focus-image">
            <img src={image(selected.img, 1100)} alt={selected.name} />
            <button ref={closeRef} type="button" className="gazu-shelf-back" onClick={() => {setSelectedId(null);setNotice("");}}>
              <ArrowLeft size={16} aria-hidden="true" /> Back to shelf
            </button>
          </div>
          <div className="gazu-shelf-focus-info">
            <p className="gazu-shelf-overline">GAZU / {selected.category} / {selected.type || "Collection"}</p>
            <h3>{selected.name}</h3>
            <p className="gazu-shelf-reviewline">
              {selected.reviewCount ? `★ ${Number(selected.rating || 0).toFixed(1)} · ${selected.reviewCount} customer reviews` : "Not yet reviewed"}
            </p>
            <p className="gazu-shelf-focus-price">{selected.pricePending ? "Price to be confirmed" : money(selected.price)}</p>
            <p className="gazu-shelf-focus-description">{selected.description || "Explore this piece from the GAZU wardrobe."}</p>
            <div className="gazu-shelf-facts">
              {selected.color && <span>Colour <strong>{selected.color}</strong></span>}
              <span>Availability <strong>{selected.pricePending ? "Awaiting price" : selected.available ? `${selected.quantity} in stock` : "Out of stock"}</strong></span>
            </div>
            <div className="gazu-shelf-focus-actions">
              <InteractiveHoverButton className="gazu-shelf-add" disabled={!selected.available || adding} onClick={() => addOne(selected)}>
                <ShoppingBag size={16} aria-hidden="true" /> {adding ? "Adding…" : selected.available ? "Add to bag" : "Unavailable"}
              </InteractiveHoverButton>
              <Link className="gazu-shelf-detail-link" to={`/product/${selected.id}`}>Item details & reviews <ArrowUpRight size={17} aria-hidden="true" /></Link>
            </div>
            {notice && <p role="status" className="gazu-shelf-notice">{notice}</p>}
            <p className="gazu-shelf-smallprint">Actual prices, availability and ratings are supplied by GAZU's catalogue.</p>
          </div>
        </div>
      ) : (
        <div className="gazu-shelf-rows">
          {rows.map((row, i) => (
            <div className="gazu-shelf-row" key={`shelf-${i}`}>
              <div className="gazu-shelf-items">
                {row.map((p) => (
                  <article className="gazu-shelf-product" key={p.id}>
                    <button type="button" className="gazu-shelf-pick" onClick={() => {setSelectedId(p.id);setNotice("");}} aria-label={`Explore ${p.name}`}>
                      <span className="gazu-shelf-image-wrap"><img src={image(p.img, 550)} loading="lazy" alt="" /></span>
                      <span className="gazu-shelf-item-name">{p.name}</span>
                      <span className="gazu-shelf-item-price">{p.pricePending ? "Price pending" : money(p.price)}</span>
                    </button>
                    <button type="button" className={`gazu-shelf-heart ${wishlist.some((item) => item.id === p.id) ? "is-saved" : ""}`} aria-label={`Save ${p.name} to wishlist`} aria-pressed={wishlist.some((item) => item.id === p.id)} onClick={() => toggleWish(p)}>
                      <Heart size={17} fill={wishlist.some((item) => item.id === p.id) ? "currentColor" : "none"} aria-hidden="true" />
                    </button>
                  </article>
                ))}
              </div>
              <div className="gazu-shelf-edge" aria-hidden="true" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ProductShelf;
