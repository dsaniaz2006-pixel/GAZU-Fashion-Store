import React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useFetch } from "../hooks/useFetch.js";
import Lookbook from "../pages/Lookbook.jsx";
import StyleFinder from "../pages/StyleFinder.jsx";
import Launches from "../pages/Launches.jsx";

vi.mock("../hooks/useFetch.js", () => ({ useFetch: vi.fn() }));
vi.mock("../components/editorial/GazuEditorialArrival.jsx", () => ({
  default: ({ title, actionLabel, onAction }) => <section data-testid="arrival"><h1>{title}</h1><button onClick={onAction}>{actionLabel}</button></section>,
}));
vi.mock("../components/editorial/GazuEditNav.jsx", () => ({
  default: () => <nav aria-label="Editorial collections navigation">Editorial navigation</nav>,
}));
vi.mock("../components/dress-like/DressLikeSection.jsx", () => ({
  default: ({ onExplore }) => <button onClick={onExplore}>DRESS LIKE: EXPLORE COLLECTION</button>,
}));
vi.mock("../lib/curation.mjs", () => ({
  curateLook: (p) => p,
  styleQuizResults: (p, style) => p.filter(item => style !== "street" || item.name.includes("Graphic")),
}));

afterEach(() => { cleanup(); vi.clearAllMocks(); });
const item = { _id: "test-product-1", name: "Graphic T-Shirt", img: "/catalog/demo.svg", pricePaise: 129900 };
function mount(component) { return render(<MemoryRouter>{component}</MemoryRouter>); }

test("Shop the Look has GAZU arrival, liquid edit-navigation and DRESS LIKE section", () => {
  vi.mocked(useFetch).mockReturnValue({ data: { items: [item] }, loading: false, error: null, reload: vi.fn() });
  mount(<Lookbook />);
  expect(screen.getByRole("heading", { level: 1, name: "SHOP THE LOOK" })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "Editorial collections navigation" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /DRESS LIKE/ })).toBeInTheDocument();
  expect(screen.getByText("Graphic T-Shirt")).toBeInTheDocument();
});

test("Style Finder retains interactive style selection with editorial treatment", () => {
  vi.mocked(useFetch).mockReturnValue({ data: { items: [item] }, loading: false, error: null, reload: vi.fn() });
  mount(<StyleFinder />);
  expect(screen.getByRole("heading", { level: 1, name: "FIND YOUR STYLE" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /STREET/ }));
  expect(screen.getByRole("button", { name: /STREET/ })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByText("Graphic T-Shirt")).toBeInTheDocument();
});

test("Launches keeps backend announcements, with matching editorial hero", () => {
  vi.mocked(useFetch).mockReturnValue({ data: [{ _id: "l1", title: "Heritage", description: "New edit", startsAt: "2028-01-02T00:00:00Z", link: "/shop" }], loading: false, error: null, reload: vi.fn() });
  mount(<Launches />);
  expect(screen.getByRole("heading", { level: 1, name: "THE NEXT CHAPTER" })).toBeInTheDocument();
  expect(screen.getByText("Heritage")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /EXPLORE COLLECTION/ })).toHaveAttribute("href", "/shop");
});
