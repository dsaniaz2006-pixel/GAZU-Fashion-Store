import React, { createRef } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import CinematicModelHero from "../components/brand/CinematicModelHero.jsx";

const spy = vi.hoisted(() => ({
  timeline: vi.fn(),
  fromTo: vi.fn(),
  to: vi.fn(),
  revert: vi.fn(),
  finish: null,
}));

vi.mock("gsap", () => {
  const timeline = {
    fromTo: (...args) => { spy.fromTo(...args); return timeline; },
    to: (...args) => { spy.to(...args); return timeline; },
  };
  return { gsap: {
    utils: { toArray: (selector, root) => [...root.querySelectorAll(selector)] },
    set: vi.fn(),
    context: (callback) => { callback(); return { revert: spy.revert }; },
    timeline: ({ onComplete }) => { spy.finish = onComplete; spy.timeline(); return timeline; },
  } };
});

test("completed homepage hero shows the three models and preserves the shop CTA", () => {
  const onShop = vi.fn();
  const { container } = render(<CinematicModelHero awaitingIntro={false} onShop={onShop} />);
  expect(container.querySelectorAll(".cinematic-model-panel")).toHaveLength(3);
  expect(screen.getByRole("heading", { name: /LOOKS YOU REMEMBER/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Explore GAZU/i }));
  expect(onShop).toHaveBeenCalledOnce();
});

test("first visit launches a single staged GSAP timeline via the exposed ref", async () => {
  const ref = createRef();
  const { container, unmount } = render(<CinematicModelHero ref={ref} awaitingIntro />);
  expect(container.querySelector(".is-awaiting")).toBeInTheDocument();
  await act(async () => { await ref.current.reveal(); });
  await waitFor(() => expect(spy.timeline).toHaveBeenCalled());
  expect(spy.fromTo.mock.calls.filter(([element]) => element?.classList?.contains("cinematic-model-panel"))).toHaveLength(3);
  expect(spy.fromTo.mock.calls.filter(([element]) => element?.classList?.contains("cinematic-model-strip"))).toHaveLength(1);
  await act(async () => { await ref.current.reveal(); });
  expect(spy.timeline).toHaveBeenCalledTimes(1);
  act(() => spy.finish());
  expect(container.querySelector(".is-awaiting")).toBeNull();
  unmount();
  expect(spy.revert).toHaveBeenCalled();
});

test("failed external image displays a neutral fallback instead of broken-image icon", () => {
  const { container } = render(<CinematicModelHero awaitingIntro={false} />);
  const img = container.querySelector(".cinematic-men img");
  fireEvent.error(img);
  expect(container.querySelector(".cinematic-men .cinematic-model-image-fallback")).toBeInTheDocument();
});
