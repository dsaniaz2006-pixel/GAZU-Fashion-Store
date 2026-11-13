import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch.js";
import { useDebounce } from "../hooks/useDebounce.js";
import { toProduct } from "../api.js";
import ProductGrid from "../components/ProductGrid.jsx";
import ProductShelf from "../components/ui/skincare-product-shelf.jsx";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import { ErrorState } from "../components/AsyncState.jsx";
import GazuLiquidSectionNav from "../components/ui/GazuLiquidSectionNav.jsx";
import { MEN_SECTION_ITEMS, menSectionIndex } from "../components/ui/liquidSectionRoutes.mjs";
export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState("shelf");
  const [preferredSort, setPreferredSort] = useLocalStorage(
    "gazu-sort",
    "featured",
    (value) =>
      ["featured", "newest", "price_asc", "price_desc"].includes(value),
  );
  const query = useDebounce(params.get("q") || "");
  const category = params.get("category") || "",
    type = category === "Men" ? params.get("type") || "" : "",
    sort = params.get("sort") || preferredSort,
    page = Number(params.get("page") || 1);
  useEffect(() => {
    if (!params.has("sort")) {
      const next = new URLSearchParams(params);
      next.set("sort", preferredSort);
      setParams(next, { replace: true });
    }
  }, [params, preferredSort, setParams]);
  const safePage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  const request = new URLSearchParams({
    q: query,
    sort,
    page: String(safePage),
    limit: ["Footwear", "Topwear", "Bottomwear", "Winterwear", "Accessories"].includes(type) ? "24" : "12",
    ...(category ? { category } : {}),
    ...(type ? { type } : {}),
  });
  const { data, loading, error, reload } = useFetch(`/ai/search?${request}`);
  const change = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key === "category") next.delete("type");
    if (key !== "page") next.delete("page");
    if (key === "sort") setPreferredSort(value);
    setParams(next, { replace: key === "q" });
  };
  return (
    <main className="page-wrap">
      <p className="eyebrow">THE GAZU WARDROBE</p>
      <h1>{category === "Men" && type ? `MEN'S ${type.toUpperCase()}` : "SHOP THE EDIT"}</h1>
      {category === "Men" && (
        <GazuLiquidSectionNav
          label="Men's sections"
          className="mens-footwear-nav"
          items={MEN_SECTION_ITEMS}
          active={menSectionIndex(type)}
          onSelect={(_, section) => change("type", section.value)}
        />
      )}
      <div className="shop-toolbar gap-4 flex-wrap">
        <label>
          Search
          <input
            aria-label="Search products"
            value={params.get("q") || ""}
            onChange={(e) => change("q", e.target.value)}
            placeholder="Try black oversized streetwear under ₹3,000"
            maxLength={100}
          />
        </label>
        <label>
          Category
          <select
            value={category}
            onChange={(e) => change("category", e.target.value)}
          >
            <option value="">All categories</option>
            {["Men", "Women", "Kids", "Accessories"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select value={sort} onChange={(e) => change("sort", e.target.value)}>
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </label>
      </div>
      {loading || query !== (params.get("q") || "") ? (
        <p role="status">Loading products...</p>
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : (
        <>
          <div className="gazu-shop-display-options">
            <p>{data.total} pieces{query ? ` · ${data.mode === "semantic" ? "AI semantic match" : "keyword match"}` : ""}</p>
            <div role="group" aria-label="Product display">
              <button type="button" className={view === "shelf" ? "is-active" : ""} aria-pressed={view === "shelf"} onClick={() => setView("shelf")}>Shelf view</button>
              <button type="button" className={view === "grid" ? "is-active" : ""} aria-pressed={view === "grid"} onClick={() => setView("grid")}>Grid view</button>
            </div>
          </div>
          {!data.items.length ? (
            <p>No products match your search.</p>
          ) : (
            view === "shelf" ? <ProductShelf products={data.items.map(toProduct)} /> : <ProductGrid products={data.items.map(toProduct)} />
          )}
          <GazuLiquidSectionNav
            label="Pagination"
            className="gazu-pagination-nav"
            items={[
              { label: "← PREVIOUS", disabled: safePage <= 1 },
              { label: `PAGE ${safePage} / ${Math.max(1, data.pages)}`, disabled: true },
              { label: "NEXT →", disabled: safePage >= data.pages },
            ]}
            active={1}
            onSelect={(index) => {
              if (index === 0) change("page", String(safePage - 1));
              if (index === 2) change("page", String(safePage + 1));
            }}
          />
        </>
      )}
    </main>
  );
}
