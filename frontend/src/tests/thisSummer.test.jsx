import React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ThisSummerSection from "../components/summer/ThisSummerSection.jsx";
import { SUMMER_GALLERY_ITEMS } from "../components/summer/summerGalleryData.js";

afterEach(() => cleanup());

test("summer gallery shows the editorial title, not a product carousel", () => {
  render(<ThisSummerSection onExplore={() => {}} />);
  expect(screen.getByRole("heading", { name: "THIS SUMMER" })).toBeInTheDocument();
  expect(screen.getByTestId("gazu-summer-gallery")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /next|previous/i })).not.toBeInTheDocument();
  expect(screen.getAllByRole("listitem")).toHaveLength(SUMMER_GALLERY_ITEMS.length);
});

test("CTA sends customers to the existing collection route", () => {
  const onExplore = vi.fn();
  render(<ThisSummerSection onExplore={onExplore} />);
  fireEvent.click(screen.getByRole("button", { name: /EXPLORE COLLECTION/i }));
  expect(onExplore).toHaveBeenCalledTimes(1);
});

test("decorative infinite-loop copies are removed from the accessibility tree", () => {
  render(<ThisSummerSection onExplore={() => {}} />);
  const gallery = screen.getByTestId("gazu-summer-gallery");
  const sets = gallery.querySelectorAll(".gazu-summer-sequence");
  expect(sets).toHaveLength(3);
  expect(sets[0].getAttribute("aria-hidden")).toBe("true");
  expect(sets[1].getAttribute("aria-hidden")).toBeNull();
  expect(sets[2].getAttribute("aria-hidden")).toBe("true");
  expect(gallery.querySelectorAll("img")).toHaveLength(3 * SUMMER_GALLERY_ITEMS.length);
});
