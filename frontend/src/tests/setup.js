import "@testing-library/jest-dom/vitest";

import {afterEach,vi} from "vitest";
import {cleanup} from "@testing-library/react";
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();sessionStorage.clear();localStorage.clear();});

// jsdom does not implement matchMedia. ScrollTrigger needs it during import,
// before individual tests have a chance to create their own mocks.
Object.defineProperty(window, "matchMedia", {
  configurable: true,
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false; },
  }),
});

// No graphics rendering takes place in unit tests. The navbar must exercise
// its graceful WebGL-unavailable fallback instead of emitting jsdom errors.
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  writable: true,
  value: () => null,
});

// Some jsdom releases omit animation-frame scheduling. Keep animation-driven
// components mountable without changing their browser implementation.
if (typeof window.requestAnimationFrame !== "function") {
  window.requestAnimationFrame = (callback) => window.setTimeout(() => callback(performance.now()), 16);
  window.cancelAnimationFrame = (handle) => window.clearTimeout(handle);
}
