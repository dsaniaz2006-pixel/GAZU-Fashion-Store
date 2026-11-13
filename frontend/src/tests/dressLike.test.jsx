import React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import DressLikeSection from "../components/dress-like/DressLikeSection.jsx";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test("editorial section displays the right copy and navigates to the live collection", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  const onExplore = vi.fn();
  render(<DressLikeSection onExplore={onExplore} />);
  expect(screen.getByRole("heading", { level: 2, name: "DRESS LIKE" })).toBeInTheDocument();
  expect(screen.getByText("@GAZU.STUDIO")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /GAZU fashion editorial/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /EXPLORE COLLECTION/i }));
  expect(onExplore).toHaveBeenCalledOnce();
});

test("image failure leaves a visible accessible editorial fallback", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  render(<DressLikeSection onExplore={() => {}} />);
  fireEvent.error(screen.getByRole("img", { name: /GAZU fashion editorial/ }));
  expect(screen.getByRole("img", { name: "GAZU editorial photograph unavailable" })).toBeInTheDocument();
});
