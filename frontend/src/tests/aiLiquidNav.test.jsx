import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Header from "../components/Header.jsx";
import { StorefrontContext } from "../context/StorefrontContext.jsx";

const base = { user: null, wishlist: [], totalQty: 0, menuOpen: false, setMenuOpen: vi.fn(), searchOpen: false, setSearchOpen: vi.fn(), query: "", setQuery: vi.fn(), notify: vi.fn() };
const mount = (route = "/", user = null) => {
  const go = vi.fn();
  render(<MemoryRouter initialEntries={[route]}><StorefrontContext.Provider value={{ ...base, user, go }}><Header /></StorefrontContext.Provider></MemoryRouter>);
  return go;
};
afterEach(() => { cleanup(); vi.clearAllMocks(); });

test("only one AI button exists in desktop liquid navigation and opens feature dropdown", () => {
  const go = mount();
  const nav = within(screen.getByRole("navigation", { name: "GAZU primary navigation" }));
  const ai = nav.getByRole("button", { name: "AI" });
  expect(ai).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("navigation", { name: "GAZU AI navigation" })).not.toBeInTheDocument();
  fireEvent.click(ai);
  expect(ai).toHaveAttribute("aria-expanded", "true");
  const features = within(screen.getByRole("group", { name: "AI features" }));
  expect(features.getAllByRole("button")).toHaveLength(7);
  fireEvent.click(features.getByRole("button", { name: "Visual Search" }));
  expect(go).toHaveBeenCalledWith("visual-search");
  expect(screen.queryByRole("group", { name: "AI features" })).not.toBeInTheDocument();
});

test("AI menu closes with Escape and outside click", () => {
  mount();
  const ai = within(screen.getByRole("navigation", { name: "GAZU primary navigation" })).getByRole("button", { name: "AI" });
  fireEvent.click(ai);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(ai).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(ai);
  fireEvent.pointerDown(document.body);
  expect(ai).toHaveAttribute("aria-expanded", "false");
});

test("AI navigation marks the currently active AI route and reserves admin links for admins", () => {
  mount("/visual-search");
  const ai = within(screen.getByRole("navigation", { name: "GAZU primary navigation" })).getByRole("button", { name: "AI" });
  fireEvent.click(ai);
  expect(within(screen.getByRole("group", { name: "AI features" })).getByRole("button", { name: "Visual Search" })).toHaveAttribute("aria-current", "page");
  expect(screen.queryByRole("button", { name: "AI Admin Studio" })).not.toBeInTheDocument();
});

test("AI admin tools appear only to the admin role", () => {
  mount("/", { role: "admin" });
  fireEvent.click(within(screen.getByRole("navigation", { name: "GAZU primary navigation" })).getByRole("button", { name: "AI" }));
  const menu = within(screen.getByRole("group", { name: "AI features" }));
  expect(menu.getByRole("button", { name: "AI Admin Studio" })).toBeInTheDocument();
  expect(menu.getByRole("button", { name: "Inventory Forecast" })).toBeInTheDocument();
});

test("mobile navigation has a collapsible AI item with the same destinations", () => {
  const go = mount();
  const mobile = within(screen.getByRole("navigation", { name: "Mobile categories" }));
  const ai = mobile.getByRole("button", { name: /AI/ });
  expect(ai).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(ai);
  const menu = within(screen.getByRole("group", { name: "AI features mobile" }));
  fireEvent.click(menu.getByRole("button", { name: "Style Finder" }));
  expect(go).toHaveBeenCalledWith("style-finder");
});
