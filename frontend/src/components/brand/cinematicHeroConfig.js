import { MOTION } from "../../animations/motionConfig.js";
// The Men and Kids images are the exact Unsplash IDs used by the existing
// homepage hero before this Phase 2 upgrade (not replacement models).
// The woman's frame is a cropped reference from the USER-SUPPLIED NS Store
// recording. This reference frame is DEVELOPMENT ONLY, not rights-cleared for
// live advertising. Production retains the previously used Women editorial URL
// until a properly licensed, clean original is supplied.
export const CINEMATIC_MODELS = Object.freeze([
  {
    department: "WOMEN",
    referencePreview: "/editorial/woman-reference-preview-only.webp",
    photoId: "photo-1529139574466-a303027c1d8b",
    alt: "Woman with brushed-back hair, hand to forehead, in a light pinstriped blazer",
    position: "54% 35%",
  },
  {
    department: "MEN",
    photoId: "photo-1487222477894-8943e31ef7b2",
    alt: "Fashion editorial of a man in brown outerwear and sunglasses",
    position: "50% 33%",
  },
  {
    department: "KIDS",
    photoId: "photo-1519238263530-99bdd11df2ea",
    alt: "Child in casual fashion clothing, photographed outdoors",
    position: "50% 35%",
  },
]);

export const CINEMATIC_HERO_TIMING = Object.freeze({
  firstRevealAt: 0.1,
  stagger: MOTION.stagger,
  panelDuration: MOTION.duration,
  titleStart: 0.55,
  titleDuration: MOTION.duration,
  captionStart: 0.67,
  ctaStart: 0.75,
});
