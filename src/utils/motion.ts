import { Variants } from 'motion/react';

/**
 * Standard cubic-bezier easing functions mimicking Material Design / Google Motion.
 */
export const EASING = {
  standard: [0.4, 0.0, 0.2, 1] as [number, number, number, number],       // recommended for general transitions
  decelerated: [0.0, 0.0, 0.2, 1] as [number, number, number, number],    // for entering elements
  accelerated: [0.4, 0.0, 1, 1] as [number, number, number, number],      // for exiting elements
  sharp: [0.4, 0.0, 0.6, 1] as [number, number, number, number],          // for exiting elements returning quickly
};

/**
 * Page transition animation variants for page wrapper component entries/exits.
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: EASING.decelerated,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.25,
      ease: EASING.sharp,
    },
  },
};

/**
 * Card hover visual lifting and shadow scaling variants.
 */
export const cardHoverVariants: Variants = {
  initial: {
    y: 0,
    transition: {
      duration: 0.2,
      ease: EASING.standard,
    },
  },
  hover: {
    y: -4,
    transition: {
      duration: 0.25,
      ease: EASING.standard,
    },
  },
};

/**
 * Section reveal animation variants for clean visual fades and structural entrances.
 */
export const sectionRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: EASING.decelerated,
    },
  },
};

/**
 * Container component variant to stagger sequential child animations.
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

/**
 * Fade-in-up variants for sequential staggered items or quick element entrances.
 */
export const fadeInUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: EASING.decelerated,
    },
  },
};
