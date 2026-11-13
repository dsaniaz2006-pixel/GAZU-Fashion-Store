// These image identifiers are re-used from the pre-existing GAZU homepage,
// department cards, or cinematic Men/Kids hero; no new product images are invented.
// Source photos are remotely hosted, so connection and licensing limitations apply.
export const SUMMER_GALLERY_ITEMS = Object.freeze([
  { id: "easy-days", department: "Women", photoId: "photo-1496747611176-843222e1e57c", position: "50% 30%", tilt: "-1.4deg" },
  { id: "daily-uniform", department: "Men", photoId: "photo-1487222477894-8943e31ef7b2", position: "50% 35%", tilt: "0.9deg" },
  { id: "little-different", department: "Women", photoId: "photo-1524504388940-b1c1722653e1", position: "50% 26%", tilt: "-0.7deg" },
  { id: "young-perspectives", department: "Kids", photoId: "photo-1519238263530-99bdd11df2ea", position: "50% 34%", tilt: "1.2deg" },
  { id: "modern-classics", department: "Men", photoId: "photo-1516257984-b1b4d707412e", position: "50% 28%", tilt: "-1deg" },
  { id: "after-hours", department: "Women", photoId: "photo-1534528741775-53994a69daeb", position: "50% 30%", tilt: "0.9deg" },
  { id: "playful-days", department: "Kids", photoId: "photo-1519238263530-99bdd11df2ea", position: "50% 34%", tilt: "-1deg" },
  { id: "everyday-portrait", department: "Men", photoId: "photo-1506794778202-cad84cf45f1d", position: "50% 25%", tilt: "1.1deg" },
]);

// Source-video observation: one cohesive strip moves right at ~140px/second
// inside an approximately 920px-wide reference canvas. Scale gently with viewport.
export const SUMMER_DIRECTION = "right";
export const SUMMER_SETS = 3;
export const summerPixelsPerSecond = (viewportWidth) =>
  Math.max(85, Math.min(235, Math.round(Number(viewportWidth || 920) * 0.15)));

export function summerLoopGeometry(sequenceWidth, viewportWidth) {
  const width = Number(sequenceWidth);
  if (!Number.isFinite(width) || width <= 0) return null;
  const pixelsPerSecond = summerPixelsPerSecond(viewportWidth);
  return {
    // Start on the middle of three identical sequences, move right one full
    // sequence length, then repeat across an identical, seamless boundary.
    fromX: -width,
    toX: 0,
    duration: width / pixelsPerSecond,
    pixelsPerSecond,
  };
}
