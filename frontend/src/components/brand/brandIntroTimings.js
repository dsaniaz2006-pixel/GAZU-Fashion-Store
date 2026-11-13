import { MOTION } from "../../animations/motionConfig.js";

// Timeline positions are deliberately distinct from tween durations.
// Every actual entrance, mask, settlement and exit lasts MOTION.duration.
export const BRAND_INTRO_TIMING = Object.freeze({
  anticipation: 0.5,
  fragmentsStart: 0.5,
  fragmentDuration: MOTION.duration,
  fragmentStagger: 0.05,
  settleStart: 1.78,
  taglineStart: 2.48,
  holdStart: 3.18,
  exitStart: 3.78,
  exitDuration: MOTION.duration,
});
