import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import Home from "../components/Home.jsx";
import Header from "../components/Header.jsx";
import { StorefrontContext } from "../context/StorefrontContext.jsx";
import { MemoryRouter } from "react-router-dom";

const response = (payload) => ({ ok: true, status: 200, json: async () => payload });
const go = vi.fn();
const state = { version: 0, go, user: null, wishlist: [], totalQty: 0, menuOpen: false, setMenuOpen: vi.fn(), searchOpen: false, setSearchOpen: vi.fn(), query: "", setQuery: vi.fn() };
const mount = (page) => render(<MemoryRouter initialEntries={["/"]}><StorefrontContext.Provider value={state}>{page}</StorefrontContext.Provider></MemoryRouter>);
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

test("editorial landing keeps real shop navigation, 3 departments and product API", async () => {
  const fetcher = vi.fn(async () => response({ items: [], total: 0 }));
  vi.stubGlobal("fetch", fetcher);
  mount(<Home />);
  expect(screen.getByRole("heading", { level: 1, name: /LOOKS YOU REMEMBER/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "THIS SUMMER" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "BEST OF GAZU" })).toBeInTheDocument();
  await waitFor(() => expect(fetcher.mock.calls.some(([url]) => url.includes("products?limit=4"))).toBe(true));
  const menLink = screen.getByRole("link", { name: "Explore Men collection" });
  expect(menLink).toHaveAttribute("href", "/shop?category=Men");
  fireEvent.click(menLink);
  fireEvent.click(screen.getByRole("button", { name: "Your account" }));
  expect(go).toHaveBeenCalledWith("account");
});

test("cinematic banner is one unified Women–Men–Kids composition", () => {
  vi.stubGlobal("fetch", vi.fn(async () => response({ items: [] })));
  mount(<Home />);
  const hero = screen.getByTestId("cinematic-three-model-hero");
  const photos = hero.querySelectorAll(".cinematic-model-photo");
  expect(photos).toHaveLength(3);
  expect(hero.querySelectorAll(".cinematic-model-panel")).toHaveLength(3);
  expect(new Set([...photos].map((photo) => photo.getAttribute("src"))).size).toBe(3);
  expect(screen.getByRole("heading", { level: 1, name: /LOOKS YOU REMEMBER/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Next editorial story" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Explore GAZU/i }));
  expect(go).toHaveBeenCalledWith("shop", "All");
});

test("new homepage header keeps existing account, search, cart and departments", () => {
  mount(<Header />);
  expect(screen.getByRole("button", { name: "GAZU home" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(state.setSearchOpen).toHaveBeenCalledWith(true);
  // Both desktop liquid navigation and mobile navigation intentionally render
  // category labels. Scope interactions to their accessible nav landmarks rather
  // than using an ambiguous global text match.
  const liquidNav = within(screen.getByRole("navigation", { name: "GAZU primary navigation" }));
  fireEvent.click(liquidNav.getByRole("button", { name: "STORY" }));
  expect(go).toHaveBeenCalledWith("about");
  fireEvent.click(liquidNav.getByRole("button", { name: "MEN" }));
  expect(go).toHaveBeenLastCalledWith("shop", "Men");

  const mobileNav = within(screen.getByRole("navigation", { name: "Mobile categories" }));
  fireEvent.click(mobileNav.getByRole("button", { name: "MEN" }));
  expect(go).toHaveBeenLastCalledWith("shop", "Men");
});
