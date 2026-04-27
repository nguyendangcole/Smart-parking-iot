// Shared scroll-reveal vocabulary for the landing page. Centralizing the
// easing / duration / viewport rules here keeps every section visually in
// lockstep — change a value in one place and the whole page stays cohesive.

// Polished cubic-bezier ease-out curve (similar to iOS "ease-out-expo"). Gives
// reveals a smooth, decelerating feel without the harsh stop of `ease-out`.
const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

export const REVEAL_TRANSITION = {
  duration: 0.65,
  ease: REVEAL_EASE,
};

// `once: true` so the reveal only plays the first time a section enters view —
// repeating it on every re-entry would feel distracting when the user scrolls
// up and down. amount: 0.2 means "fire when ~20% of the element is in view"
// which feels natural rather than waiting for full visibility.
export const REVEAL_VIEWPORT = {
  once: true,
  amount: 0.2,
} as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: REVEAL_TRANSITION },
};

export const fadeRight = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: REVEAL_TRANSITION },
};

export const fadeLeft = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: REVEAL_TRANSITION },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: REVEAL_TRANSITION },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: REVEAL_TRANSITION },
};

// Container variant: the parent itself doesn't transform, but its `visible`
// state staggers the entry of children using their own variants. Pair with
// motion.div whileInView="visible" + child motion.* with their own variants.
//
// `delayChildren`  — wait this long after the parent goes visible before
//                    starting the first child (useful when the parent itself
//                    has its own fade-in we want to play first).
// `staggerChildren` — gap between successive child reveals.
export const staggerParent = (
  delayChildren = 0,
  staggerChildren = 0.08,
) => ({
  hidden: {},
  visible: {
    transition: {
      delayChildren,
      staggerChildren,
    },
  },
});
