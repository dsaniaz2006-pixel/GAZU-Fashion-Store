import React, { useState, useRef, useEffect } from "react";
import { image } from "../format.js";
import { api, toProduct, uploadImage } from "../api.js";
import { useFetch } from "../hooks/useFetch.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ErrorState, EmptyState } from "../components/AsyncState.jsx";
import AICataloguePanel from "../components/AICataloguePanel.jsx";
const blank = {
  name: "",
  sku: "",
  sizeGuide: "",
  description: "",
  category: "Men",
  type: "T-Shirts",
  color: "",
  tag: "",
  img: "photo-1521572163474-6864f9cf17ab",
  price: "",
  originalPrice: "",
  quantity: 0,
  inStock: true,
};
// Simple product editor; all form fields are explicitly mapped to allowed API fields.
export default function Admin({ user, reload, go }) {
  const { token } = useAuth();
  const inventory = useFetch("/admin/products", 0, token);
  const products = (inventory.data || []).map(toProduct),
    loading = inventory.loading;
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [localPreview, setLocalPreview] = useState("");
  useEffect(() => {
    if (!selectedFile) { setLocalPreview(""); return; }
    const url = URL.createObjectURL(selectedFile);
    setLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);
  const refresh = inventory.reload;
  const operation = useRef(false);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((old) => ({
      ...old,
      [name]: type === "checkbox" ? checked : value,
    }));
  }
  async function save(event) {
    event.preventDefault();
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    const { price, originalPrice, ...fields } = form;
    if (!fields.sku) delete fields.sku;
    try {
      await api(editing ? `/admin/products/${editing}` : "/admin/products", {
        method: editing ? "PATCH" : "POST",
        body: {
          ...fields,
          pricePaise: Math.round(Number(price) * 100),
          originalPricePaise: originalPrice === "" ? null : Math.round(Number(originalPrice) * 100),
          quantity: Number(fields.quantity),
        },
      });
      setForm(blank);
      setSelectedFile(null);
      setProgress(0);
      setEditing(null);
      setMessage("Product saved.");
      await refresh();
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }
  function edit(product) {
    setEditing(product.id);
    setSelectedFile(null);
    setProgress(0);
    setError("");
    setMessage("");
    setForm(
      Object.fromEntries(
        Object.keys(blank).map((key) => [key, product[key] ?? blank[key]]),
      ),
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function remove(product) {
    if (operation.current) return;
    if (
      !window.confirm(
        `Delete ${product.name} from the catalogue? Existing orders will be kept.`,
      )
    )
      return;
    operation.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api(`/admin/products/${product.id}`, { method: "DELETE" });
      if (editing === product.id) {
        setEditing(null);
        setForm(blank);
      }
      await refresh();
      await reload();
      setMessage("Product deleted from the catalogue.");
    } catch (e) {
      setError(e.message);
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }
  if (!["admin", "inventory_manager"].includes(user?.role))
    return (
      <div className="empty">
        <h1>ADMIN ACCESS REQUIRED</h1>
        <button className="btn dark" onClick={() => go("account")}>
          ACCOUNT
        </button>
      </div>
    );
  return (
    <div className="page-wrap">
      <p className="eyebrow">GAZU / ADMIN</p>
      <h1>MANAGE THE STORE</h1>
      <p>
        {products.length} products ·{" "}
        {products.filter((p) => p.available).length} in stock
      </p>
      {loading && <p role="status">Loading inventory...</p>}
      {inventory.error && (
        <ErrorState message={inventory.error} retry={refresh} />
      )}
      {!loading && !inventory.error && !products.length && (
        <EmptyState>No products yet. Add your first product below.</EmptyState>
      )}
      <div className="admin-layout">
        <form className="checkout-form admin-form" onSubmit={save}>
          <div className="upload-panel">
            <label htmlFor="product-image">Upload image (JPEG, PNG, WebP; max 5 MB)</label>
            <input
              id="product-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSelectedFile(file);
                setProgress(0);
                setError("");
                if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0) {
                  setError("Select a JPEG, PNG or WebP image smaller than 5 MB.");
                  setSelectedFile(null);
                }
              }}
            />
            {selectedFile && <p role="status">Selected: {selectedFile.name} ({Math.ceil(selectedFile.size / 1024)} KB)</p>}
            {localPreview && <div className="image-preview"><span>Preview before upload</span><img src={localPreview} alt="Selected image preview" /></div>}
            <button type="button" className="btn" disabled={busy || !selectedFile} onClick={async () => {
              if (!selectedFile || operation.current) return;
              operation.current = true;
              setBusy(true);
              setUploading(true);
              setError("");
              setProgress(0);
              try {
                const result = await uploadImage(selectedFile, setProgress);
                setForm(old => ({ ...old, img: result.url }));
                setSelectedFile(null);
                setMessage("Image uploaded. Save the product to apply it.");
              } catch (err) {
                setError(err.message);
              } finally {
                operation.current = false;
                setBusy(false);
                setUploading(false);
              }
            }}>{uploading ? "UPLOADING…" : "UPLOAD SELECTED IMAGE"}</button>
            {uploading && <><progress aria-label="Image upload progress" max="100" value={progress} /><span role="status">{progress}% transferred</span></>}
            {form.img && <div className="image-preview"><span>Product image preview</span><img src={image(form.img, 320)} alt="Product image preview" /></div>}
          </div>
          <h2>{editing ? "EDIT PRODUCT" : "ADD PRODUCT"}</h2>
          <label>Unique SKU (optional)<input name="sku" value={form.sku} onChange={change} placeholder="GAZU-M-TOP-001" maxLength={48}/></label>
          <label>
            Name
            <input
              name="name"
              value={form.name}
              onChange={change}
              required
              minLength={2}
              maxLength={120}
            />
          </label>
          <label>Size guide / verified garment measurements<textarea name="sizeGuide" value={form.sizeGuide} onChange={change} maxLength={1000} placeholder="Enter supplier-confirmed measurements and fit notes" /></label>
          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={change}
              maxLength={1000}
            />
          </label>
          <div className="form-row">
            <label>
              Price (₹)
              <input
                name="price"
                type="number"
                min="0.01"
                max="1000000"
                step="0.01"
                value={form.price}
                onChange={change}
                required
              />
            </label>
            <label>
              Quantity
              <input
                name="quantity"
                type="number"
                min="0"
                max="100000"
                step="1"
                value={form.quantity}
                onChange={change}
                required
              />
            </label>
          </div>
          {form.tag === "PRICE PENDING" && (
            <p role="note" className="availability">Source screenshot did not show a price. Set a verified price (the ₹0.01 field is a non-selling placeholder), change Tag to remove PRICE PENDING, enter actual stock and enable availability before selling.</p>
          )}
          <label>
            Original price before discount (₹, optional)
            <input name="originalPrice" type="number" min="0.01" max="1000000" step="0.01" value={form.originalPrice} onChange={change} />
          </label>
          <div className="form-row">
            <label>
              Category
              <select name="category" value={form.category} onChange={change}>
                {["Men", "Women", "Kids", "Accessories"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Type
              <input
                name="type"
                value={form.type}
                onChange={change}
                required
                maxLength={50}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Colour
              <input
                name="color"
                value={form.color}
                onChange={change}
                maxLength={50}
              />
            </label>
            <label>
              Tag
              <input
                name="tag"
                value={form.tag}
                onChange={change}
                maxLength={30}
              />
            </label>
          </div>
          <label>
            Image URL or Unsplash photo ID
            <input name="img" value={form.img} onChange={change} required />
          </label>
          <small>
            Keep the default image or enter a photo ID such as
            photo-1521572163474-6864f9cf17ab, an existing bundled Men clothing, footwear, winterwear or accessories image path,
            or use the image uploader above.
          </small>
          <label className="check-label">
            <input
              name="inStock"
              type="checkbox"
              checked={form.inStock}
              onChange={change}
            />{" "}
            Mark available for sale
          </label>
          <small>
            Zero quantity always displays OUT OF STOCK. Uncheck to stop selling
            even if quantity remains.
          </small>
          {error && (
            <p className="error-box" role="alert">
              {error}
            </p>
          )}
          {message && <p role="status">{message}</p>}
          <div className="action-row">
            <button disabled={busy} className="btn dark">
              {busy ? "SAVING…" : editing ? "SAVE CHANGES" : "ADD PRODUCT"}
            </button>
            {editing && (
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => {
                  setEditing(null);
                  setForm(blank);
                }}
              >
                CANCEL EDIT
              </button>
            )}
          </div>
        </form>
        <AICataloguePanel products={products} />
        <div className="admin-products">
          {products.map((p) => (
            <article className="admin-product" key={p.id}>
              <img src={image(p.img, 160)} alt={p.name} />
              <div>
                <h3>{p.name}</h3>
                <p>
                  ₹{p.price.toLocaleString("en-IN")} · Qty {p.quantity}
                </p>
                <p>{p.available ? "IN STOCK" : "OUT OF STOCK"} · SKU: {p.sku || 'Not assigned'} · {p.publicationStatus || 'published'}</p>
                {user?.role === 'admin' && <div className="gazu-phase-controls"><label>Publication status
                  <select value={p.publicationStatus||'published'} disabled={busy} onChange={async e=>{setBusy(true);setError('');try{await api(`/admin/products/${p.id}/publication`,{method:'PATCH',body:{status:e.target.value}});await refresh();await reload()}catch(err){setError(err.message)}finally{setBusy(false)}}}>
                    <option value="draft">Draft · Hidden</option><option value="review">Under review · Hidden</option><option value="published">Published · Visible</option>
                  </select></label></div>}
                {editing===p.id && <label>Size inventory (optional; comma separated, e.g. S:5,M:7)
                  <input type="text" aria-label="Size inventory" placeholder="S:5,M:7,L:3" id={`variants-${p.id}`} defaultValue={(p.variants||[]).map(v=>`${v.size}:${v.quantity}`).join(',')}/>
                  <button className="text-link" type="button" disabled={busy} onClick={async()=>{
                    setBusy(true);setError('');try{const raw=document.getElementById(`variants-${p.id}`).value.trim();const variants=raw?raw.split(',').map(t=>{const [size,quantity]=t.split(':');return {size:size.trim(),quantity:Number(quantity)}}):[];
                      await api(`/admin/products/${p.id}/variants`,{method:'PATCH',body:{variants}});await refresh();setMessage('Size inventory updated.');
                    }catch(e){setError(e.message)}finally{setBusy(false)}}}>SAVE SIZE STOCK</button>
                </label>}
                <div className="action-row">
                  <button
                    className="text-link"
                    disabled={busy}
                    onClick={() => edit(p)}
                  >
                    EDIT
                  </button>
                  <button
                    className="text-link danger"
                    disabled={busy}
                    onClick={() => remove(p)}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
