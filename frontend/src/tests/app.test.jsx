import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  within,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { afterEach, test, expect, vi } from "vitest";
import { cartReducer, initialCartState } from "../context/cartReducer.js";
import { AuthProvider } from "../context/AuthContext.jsx";
import { StorefrontContext } from "../context/StorefrontContext.jsx";
import { ProtectedRoute, AdminRoute } from "../routes/Guards.jsx";
import Shop from "../pages/Shop.jsx";
import ProductDetail from "../pages/ProductDetail.jsx";
import { CartProvider } from "../context/CartContext.jsx";
import App from "../App.jsx";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  sessionStorage.clear();
});
const respond = (data) => ({ ok: true, status: 200, json: async () => data });
test("cart reducer adds, changes, removes and clears", () => {
  let s = cartReducer(initialCartState, { type: "ADD_ITEM", item: { id: "a", qty: 1 } });
  s = cartReducer(s, { type: "ADD_ITEM", item: { id: "a", qty: 2 } });
  expect(s.items[0].qty).toBe(3);
  s = cartReducer(s, { type: "UPDATE_QUANTITY", id: "a", quantity: 5 });
  expect(s.items[0].qty).toBe(5);
  expect(cartReducer(s, { type: "REMOVE_ITEM", id: "a" }).items).toEqual([]);
  expect(cartReducer(s, { type: "CLEAR_CART" }).items).toEqual([]);
});
test("anonymous checkout redirects to account", async () => {
  render(
    <MemoryRouter initialEntries={["/checkout"]}>
      <AuthProvider>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<p>Private checkout</p>} />
          </Route>
          <Route path="/account" element={<p>Sign in here</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
  expect(await screen.findByText("Sign in here")).toBeInTheDocument();
});
test("customer cannot open nested admin page", async () => {
  sessionStorage.setItem("gazu-token", "test");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => respond({ user: { id: "u", role: "customer" } })),
  );
  render(
    <MemoryRouter initialEntries={["/admin/products"]}>
      <AuthProvider>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminRoute />}>
              <Route path="/admin/products" element={<p>Secret inventory</p>} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
  expect(
    await screen.findByText("Administrator access required."),
  ).toBeInTheDocument();
});
test("shop debounces search and sends server pagination", async () => {
  const fetcher = vi.fn(async () =>
    respond({ items: [], total: 20, pages: 2 }),
  );
  vi.stubGlobal("fetch", fetcher);
  render(
    <MemoryRouter>
      <StorefrontContext.Provider value={{}}>
        <Shop />
      </StorefrontContext.Provider>
    </MemoryRouter>,
  );
  await screen.findByText("20 pieces");
  fireEvent.change(screen.getByLabelText("Search products"), {
    target: { value: "cotton" },
  });
  await waitFor(() =>
    expect(fetcher.mock.calls.some(([url]) => url.includes("q=cotton"))).toBe(
      true,
    ),
  );
  // The redesigned pagination uses a labeled liquid navbar with "NEXT →".
  // Scope to this navigation instead of depending on its visual copy.
  const pagination = within(screen.getByRole("navigation", { name: "Pagination" }));
  fireEvent.click(pagination.getByRole("button", { name: /NEXT/i }));
  await waitFor(() =>
    expect(fetcher.mock.calls.some(([url]) => url.includes("page=2"))).toBe(
      true,
    ),
  );
});
test("product URL loads detail and reviews directly", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) =>
      respond(
        url.includes("reviews")
          ? { items: [], pages: 0 }
          : {
              _id: "p",
              name: "Cotton Tee",
              category: "Men",
              pricePaise: 10000,
              rating: 0,
              reviewCount: 0,
              active: true,
              inStock: true,
              quantity: 3,
            },
      ),
    ),
  );
  render(
    <MemoryRouter initialEntries={["/product/p"]}>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/product/:id" element={<ProductDetail />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
  // Product name appears in both the breadcrumb and the product heading.
  expect(await screen.findByRole("heading", { level: 1, name: "Cotton Tee" })).toBeInTheDocument();
  expect(await screen.findByText(/No reviews yet\./)).toBeInTheDocument();
});
test("original home layout renders after component split", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) =>
      respond(
        url.includes("payments") ? { mockEnabled: false } : { items: [] },
      ),
    ),
  );
  render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
  expect(await screen.findByText("BEST OF GAZU")).toBeInTheDocument();
});
