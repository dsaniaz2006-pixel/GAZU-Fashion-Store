import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, ChevronDown, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useFetch } from "../hooks/useFetch.js";
import { api, toProduct } from "../api.js";
import { image, money } from "../format.js";
import "./ProductDetail.css";

const STARS = [1, 2, 3, 4, 5];

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const cart = useCart();
  const operation = useRef(false);
  const [version, setVersion] = useState(0);
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [bagNotice, setBagNotice] = useState("");
  const [activePhoto, setActivePhoto] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const product = useFetch(`/products/${id}`, version);
  const reviews = useFetch(`/products/${id}/reviews?page=${page}`, version);

  // Reset the scrollable review page when a new product is displayed.
  useEffect(() => { setPage(1); setActivePhoto(0); setQuantity(1); setSelectedSize(''); setBagNotice(""); }, [id]);

  async function submit(event) {
    event.preventDefault();
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5 || comment.trim().length < 3) {
      setError("Choose 1–5 stars and write at least 3 characters.");
      operation.current = false;
      setBusy(false);
      return;
    }
    try {
      await api(`/products/${id}/reviews`, { method: "POST", body: { rating: Number(rating), comment } });
      setComment("");
      setPage(1);
      setVersion((value) => value + 1);
    } catch (err) {
      setError(err.status === 409 ? "You already reviewed this product. You can delete your earlier review before posting another." : err.message);
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  async function remove(review) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    try {
      await api(`/reviews/${review._id}`, { method: "DELETE" });
      setVersion((value) => value + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  async function addProduct(p) {
    if (!p.available || adding || cart.busy) return;
    setAdding(true);
    setBagNotice("");
    setError("");
    try {
      await cart.add(p, quantity, selectedSize);
      setBagNotice(`${quantity} ${quantity === 1 ? "item" : "items"} added to your bag.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  if (product.loading) return <p className="page-wrap" role="status">Loading product...</p>;
  if (product.error) return <p className="page-wrap error-box" role="alert">{product.error}</p>;
  if (!product.data) return <p className="page-wrap error-box">Product not found.</p>;

  const p = toProduct(product.data);
  const productImages = [p.img, ...(Array.isArray(p.images) ? p.images : [])].filter((src, index, list) => typeof src === "string" && src.length > 0 && list.indexOf(src) === index);
  const selectedPhoto = productImages[activePhoto] || productImages[0];
  const variant = (p.variants || []).find(v => v.size === selectedSize);
  const availableSizeQty = p.variants?.length ? (variant?.quantity || 0) : p.quantity;
  const maxQuantity = Math.max(1, Math.min(99, Number(availableSizeQty) || 1));
  const average = Number(p.rating || 0);

  return (
    <main className="page-wrap gazu-pdp">
      <nav className="gazu-pdp-breadcrumb" aria-label="Breadcrumb">
        <Link to="/shop"><ArrowLeft size={15} aria-hidden="true" /> Shop the collection</Link>
        <span aria-hidden="true">/</span>
        <span>{p.category}</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{p.name}</span>
      </nav>

      <div className="gazu-pdp-layout">
        <div className="gazu-pdp-gallery">
          <div className="gazu-pdp-hero-image">
            {selectedPhoto ? <img src={image(selectedPhoto, 1300)} alt={p.name} /> : <p>Product photography coming soon</p>}
            {p.tag && <span className="gazu-pdp-image-tag">{p.tag}</span>}
          </div>
          {productImages.length > 1 && (
            <div className="gazu-pdp-thumbnails" aria-label="Product views">
              {productImages.map((src, index) => (
                <button className={index === activePhoto ? "is-active" : ""} type="button" key={src} aria-label={`Show product image ${index + 1}`} aria-pressed={index === activePhoto} onClick={() => setActivePhoto(index)}>
                  <img src={image(src, 160)} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
          <span className="gazu-pdp-photo-caption">{productImages.length > 1 ? `Image ${activePhoto + 1} of ${productImages.length}` : "GAZU product edit"}</span>
        </div>

        <section className="gazu-pdp-information" aria-label="Product details">
          <p className="gazu-pdp-overline">GAZU / {p.category}{p.type ? ` / ${p.type}` : ""}</p>
          <h1>{p.name}</h1>
          <p className="gazu-pdp-subtitle">{p.description || "A considered piece from the GAZU collection."}</p>
          <a className="gazu-pdp-rating" href="#reviews" aria-label={`Average rating ${average.toFixed(1)} out of 5 from ${p.reviewCount || 0} reviews`}>
            <span className="gazu-pdp-rating-stars" aria-hidden="true">{STARS.map((number) => <Star key={number} size={14} fill={number <= Math.round(average) ? "currentColor" : "none"} />)}</span>
            <span>{p.reviewCount ? `${average.toFixed(1)} · ${p.reviewCount} reviews` : "Be the first to review"}</span>
          </a>
          <div className="gazu-pdp-pricing">
            <strong>{p.pricePending ? "Price to be confirmed" : money(p.price)}</strong>
            {!p.pricePending && p.old && <del className="product-detail-original">{money(p.old)}</del>}
          </div>
          <div className="gazu-pdp-divider" />
          <div className="gazu-pdp-specs">
            {p.color && <div><span>COLOUR</span><strong>{p.color}</strong></div>}
            {p.type && <div><span>STYLE</span><strong>{p.type}</strong></div>}
            <div><span>AVAILABILITY</span><strong>{p.pricePending ? "Awaiting confirmed price" : p.available ? p.variants?.length ? `${availableSizeQty} available in selected size` : `In stock · ${p.quantity} available` : "Out of stock"}</strong></div>
          </div>
          {(p.variants || []).length > 0 && <div className="gazu-pdp-size-group">
            <label htmlFor="gazu-size">SELECT SIZE</label>
            <select id="gazu-size" value={selectedSize} onChange={e=>{setSelectedSize(e.target.value);setQuantity(1)}}>
              <option value="">Choose size</option>
              {p.variants.map(v=><option key={v.size} value={v.size} disabled={v.quantity===0}>{v.size}{v.quantity===0?' — Sold out':''}</option>)}
            </select>
            {p.sizeGuide && <details><summary>Size guide</summary><p>{p.sizeGuide}</p></details>}
          </div>}
          {!p.pricePending && p.available && <div className="gazu-pdp-quantity-group">
            <span id="gazu-pdp-quantity-label">QUANTITY</span>
            <div className="gazu-pdp-quantity" role="group" aria-labelledby="gazu-pdp-quantity-label">
              <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1 || adding} onClick={() => setQuantity((number) => Math.max(1, number - 1))}><Minus size={16} /></button>
              <output aria-live="polite">{quantity}</output>
              <button type="button" aria-label="Increase quantity" disabled={quantity >= maxQuantity || adding} onClick={() => setQuantity((number) => Math.min(maxQuantity, number + 1))}><Plus size={16} /></button>
            </div>
          </div>}
          <div className="gazu-pdp-purchase">
            {p.pricePending ? <p>Not available for purchase until a verified price is set.</p> : user ? (
              <button type="button" className="gazu-pdp-add" disabled={!p.available || cart.busy || adding || (p.variants?.length > 0 && (!selectedSize || availableSizeQty < quantity))} onClick={() => addProduct(p)}>
                <ShoppingBag size={17} aria-hidden="true" /> {adding ? "ADDING…" : p.available ? "ADD TO BAG" : "OUT OF STOCK"}
              </button>
            ) : (
              <Link className="gazu-pdp-add" to="/account" state={{ from: `/product/${id}` }}>Sign in to add to bag</Link>
            )}
          </div>
          {bagNotice && <p role="status" className="gazu-pdp-bag-success"><Check size={16} /> {bagNotice} <Link to="/cart">View bag</Link></p>}
          {error && <p role="alert" className="error-box">{error}</p>}

          <div className="gazu-pdp-accordions">
            <details open><summary>PRODUCT DETAILS <ChevronDown size={16} aria-hidden="true" /></summary><div><p>{p.description || "Product details will be added when available."}</p><p>Category: {p.category}{p.type ? ` · ${p.type}` : ""}{p.color ? ` · ${p.color}` : ""}</p></div></details>
            <details><summary>SHIPPING & ORDER INFORMATION <ChevronDown size={16} aria-hidden="true" /></summary><div><p>Shipping information and the available checkout options are confirmed during checkout. Sign in to place an order.</p></div></details>
            <details><summary>REVIEWS & RATINGS <ChevronDown size={16} aria-hidden="true" /></summary><div><p>{p.reviewCount ? `${p.reviewCount} verified account review(s) on this item.` : "No customer reviews have been submitted yet."} <a href="#reviews">Read customer reviews</a></p></div></details>
          </div>
        </section>
      </div>

      <section className="gazu-pdp-reviews" id="reviews" aria-labelledby="gazu-pdp-reviews-heading">
        <div className="gazu-pdp-review-header">
          <div><p className="gazu-pdp-overline">FROM THE GAZU COMMUNITY</p><h2 id="gazu-pdp-reviews-heading">CUSTOMER REVIEWS</h2></div>
          <p>{p.reviewCount ? `${average.toFixed(1)} / 5 · ${p.reviewCount} reviews` : "No ratings yet"}</p>
        </div>
        {!user && <p><Link to="/account" state={{ from: `/product/${id}` }}>Sign in to write a review</Link></p>}
        {user && <form className="gazu-pdp-review-form" onSubmit={submit}>
          <fieldset className="rating-fieldset">
            <legend>Rate this product (1 to 5 stars)</legend>
            <div className="rating-buttons" role="group" aria-label="Select star rating">
              {STARS.map((number) => (
                <button key={number} type="button" className={`rating-star ${Number(rating) >= number ? "selected" : ""}`} aria-label={`${number} star${number === 1 ? "" : "s"}`} aria-pressed={Number(rating) === number} disabled={busy} onClick={() => setRating(String(number))}>
                  {Number(rating) >= number ? "★" : "☆"}
                </button>
              ))}
            </div>
          </fieldset>
          <label>Your review
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} required aria-label="Your review" disabled={busy} minLength={3} maxLength={1000} placeholder="How was the quality, fit, or experience?" />
          </label>
          <small>One review per account for this product.</small>
          <button className="gazu-pdp-submit-review" type="submit" disabled={busy}>{busy ? "Processing…" : "Post review"}</button>
        </form>}
        {reviews.loading ? <p role="status">Loading reviews...</p> : reviews.error ? <p role="alert">{reviews.error}</p> : <>
          {!reviews.data?.items?.length && <p>No reviews yet. Be the first to share your experience.</p>}
          <div className="gazu-pdp-review-list">{(reviews.data?.items || []).map((review) => (
            <article className="gazu-pdp-review-card" key={review._id}>
              <div className="gazu-pdp-review-author"><b>{review.user?.name || "Customer"} · {review.rating}/5</b><span aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span></div>
              <p>{review.comment}</p>
              <small>{review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : ""}</small>
              {(user?.id === review.user?._id || user?.role === "admin") && <button type="button" className="text-link" disabled={busy} onClick={() => remove(review)}>Delete review</button>}
            </article>
          ))}</div>
          <div className="gazu-pdp-review-pagination">
            <button type="button" disabled={page === 1} onClick={() => setPage((number) => number - 1)}>Previous</button>
            <span>Page {page}</span>
            <button type="button" disabled={page >= (reviews.data?.pages || 1)} onClick={() => setPage((number) => number + 1)}>Next</button>
          </div>
        </>}
      </section>
    </main>
  );
}
