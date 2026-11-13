export const BRAND_INTRO_SESSION_KEY = "gazu-fragment-intro-seen-v1";

// Isolated, injectable logic keeps session behavior testable without React.
export function shouldPlayBrandIntro({
  pathname = "/",
  storage,
  reducedMotion = false,
  forceReplay = false,
} = {}) {
  if (pathname !== "/" || reducedMotion) return false;
  if (forceReplay) return true;
  if (!storage) return false;
  try {
    return storage?.getItem(BRAND_INTRO_SESSION_KEY) !== "1";
  } catch {
    // Browsing must not be interrupted when privacy settings block storage.
    return false;
  }
}

export function markBrandIntroSeen(storage) {
  try {
    storage?.setItem(BRAND_INTRO_SESSION_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export function introPlaybackOptions(location, runtime) {
  let media;
  let storage;
  try { media = runtime?.matchMedia?.("(prefers-reduced-motion: reduce)"); } catch { /* optional API */ }
  try { storage = runtime?.sessionStorage; } catch { /* privacy settings */ }
  return {
    pathname: location?.pathname,
    storage,
    reducedMotion: !!media?.matches,
    forceReplay:
      import.meta.env?.DEV === true &&
      new URLSearchParams(location?.search ?? "").get("gazuIntro") === "1",
  };
}
