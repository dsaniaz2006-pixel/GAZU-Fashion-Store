import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import BrandIntro, { BRAND_INTRO_TIMING } from "../components/brand/BrandIntro.jsx";
import {
  BRAND_INTRO_SESSION_KEY,
  markBrandIntroSeen,
  shouldPlayBrandIntro,
} from "../components/brand/brandIntroSession.js";

const animation = vi.hoisted(() => ({
  finish: null,
  fragmentAnimations: 0,
  otherTweens: 0,
  revert: vi.fn(),
}));

vi.mock("gsap", () => {
  const timeline = {
    fromTo() { animation.fragmentAnimations += 1; return timeline; },
    to() { animation.otherTweens += 1; return timeline; },
    call() { return timeline; },
  };
  return {
    gsap: {
      set: vi.fn(),
      context: (callback) => { callback(); return { revert: animation.revert }; },
      timeline: ({ onComplete }) => {
        animation.finish = onComplete;
        return timeline;
      },
    },
  };
});

beforeEach(() => {
  animation.finish = null;
  animation.fragmentAnimations = 0;
  animation.otherTweens = 0;
  animation.revert.mockClear();
});

test("complete GAZU outline is assembled from twelve actual clipped vector pieces", () => {
  render(<BrandIntro onComplete={() => {}} />);
  expect(screen.getByRole("img", { name: /GAZU\. Looks you remember/i })).toBeInTheDocument();
  const fragments = document.querySelectorAll(".gazu-brand-fragment");
  expect(fragments).toHaveLength(12);
  expect(document.querySelectorAll(".gazu-brand-artwork clipPath")).toHaveLength(12);
  expect(document.querySelectorAll(".gazu-brand-complete path")).toHaveLength(4);
  expect([...fragments].map((element) => element.getAttribute("data-letter"))).toEqual(
    ["G", "G", "G", "A", "A", "A", "Z", "Z", "Z", "U", "U", "U"],
  );
  expect(screen.getByText("LOOKS YOU REMEMBER")).toBeInTheDocument();
});

test("GSAP animates twelve fragments then completes and reverts its own styles", async () => {
  const onComplete = vi.fn();
  const onHeroReveal = vi.fn();
  const view = render(<BrandIntro onComplete={onComplete} onHeroReveal={onHeroReveal} />);
  await waitFor(() => expect(animation.fragmentAnimations).toBe(13)); // 12 pieces + final wordmark scale
  expect(animation.otherTweens).toBeGreaterThanOrEqual(3);
  expect(onComplete).not.toHaveBeenCalled();
  expect(window.sessionStorage.getItem(BRAND_INTRO_SESSION_KEY)).toBe("1");
  act(() => animation.finish());
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(onHeroReveal).toHaveBeenCalledTimes(1);
  act(() => animation.finish());
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(onHeroReveal).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(animation.revert).toHaveBeenCalled();
});

test("session playback is once per tab, skips inner routes and respects reduced motion", () => {
  const storage = window.sessionStorage;
  storage.clear();
  expect(shouldPlayBrandIntro({ storage, pathname: "/" })).toBe(true);
  expect(shouldPlayBrandIntro({ storage, pathname: "/shop" })).toBe(false);
  expect(shouldPlayBrandIntro({ storage, reducedMotion: true })).toBe(false);
  expect(markBrandIntroSeen(storage)).toBe(true);
  expect(shouldPlayBrandIntro({ storage, pathname: "/" })).toBe(false);
  expect(shouldPlayBrandIntro({ storage, forceReplay: true })).toBe(true);
  expect(shouldPlayBrandIntro({ storage: { getItem() { throw Error("Blocked"); } } })).toBe(false);
  expect(markBrandIntroSeen({ setItem() { throw Error("Blocked"); } })).toBe(false);
});

test("the staged timing preserves assembly, tagline, hold, and final exit order", () => {
  expect(BRAND_INTRO_TIMING.anticipation).toBeLessThanOrEqual(BRAND_INTRO_TIMING.fragmentsStart);
  const lastFragmentEnds = BRAND_INTRO_TIMING.fragmentsStart + 11 * BRAND_INTRO_TIMING.fragmentStagger + BRAND_INTRO_TIMING.fragmentDuration;
  expect(lastFragmentEnds).toBeLessThan(BRAND_INTRO_TIMING.settleStart);
  expect(BRAND_INTRO_TIMING.settleStart).toBeLessThan(BRAND_INTRO_TIMING.taglineStart);
  expect(BRAND_INTRO_TIMING.taglineStart + 0.5).toBeLessThanOrEqual(BRAND_INTRO_TIMING.holdStart);
  expect(BRAND_INTRO_TIMING.holdStart).toBeLessThan(BRAND_INTRO_TIMING.exitStart);
});
