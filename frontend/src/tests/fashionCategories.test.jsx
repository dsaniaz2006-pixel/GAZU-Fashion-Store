import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import FashionCategorySection from "../components/categories/FashionCategorySection.jsx";
import { FASHION_CATEGORIES } from "../components/categories/fashionCategories.js";

vi.mock("gsap", () => ({
  gsap: {
    registerPlugin: vi.fn(),
    utils: { toArray: (selector, root) => [...root.querySelectorAll(selector)] },
    fromTo: vi.fn(),
    context: callback => { callback(); return { revert: vi.fn() }; },
  },
}));
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: {} }));

function ShopDestination() {
  const { search } = useLocation();
  return <p data-testid="selected-category">{new URLSearchParams(search).get("category")}</p>;
}
function mount() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<FashionCategorySection />} />
        <Route path="/shop" element={<ShopDestination />} />
      </Routes>
    </MemoryRouter>,
  );
}

test("renders exactly three accessible category links with the existing photographs", () => {
  const { container } = mount();
  const links = screen.getAllByRole("link");
  expect(links).toHaveLength(3);
  expect(links.map(link => link.textContent)).toEqual(["WOMEN", "MEN", "KIDS"]);
  expect(container.querySelectorAll(".gazu-category-image")).toHaveLength(3);
  for (const [index, image] of [...container.querySelectorAll(".gazu-category-image")].entries()) {
    expect(image.getAttribute("src")).toContain(FASHION_CATEGORIES[index].photoId);
  }
});

test.each(["Women", "Men", "Kids"])("selecting %s opens its existing shop category", category => {
  mount();
  fireEvent.click(screen.getByRole("link", { name: `Explore ${category} collection` }));
  expect(screen.getByTestId("selected-category")).toHaveTextContent(category);
});

test("a failed category photograph shows a safe fallback without breaking its link", () => {
  const { container } = mount();
  fireEvent.error(container.querySelector(".gazu-category-image"));
  expect(container.querySelectorAll(".gazu-category-fallback")).toHaveLength(1);
  expect(screen.getByRole("link", { name: "Explore Women collection" })).toBeInTheDocument();
});
