"use client";

import React from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

// Page Entrance Animation
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
      when: "beforeChildren",
      staggerChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

// Staggered Container
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

// Item / Card Fade Up
export const fadeUpItem: Variants = {
  initial: {
    opacity: 0,
    y: 14,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Scale & Pop
export const popIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.94,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 24,
    },
  },
};

// Slide In From Right (for Drawers & Details Panels)
export const slideInRight: Variants = {
  initial: {
    x: 40,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 26,
      stiffness: 300,
    },
  },
  exit: {
    x: 40,
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

// Slide In From Bottom (for Mobile Sheets & Modals)
export const slideInBottom: Variants = {
  initial: {
    y: "100%",
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 28,
      stiffness: 320,
    },
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: {
      duration: 0.22,
      ease: "easeIn",
    },
  },
};

// Export convenience motion components
export const MotionDiv = motion.div;
export const MotionSection = motion.section;
export const MotionArticle = motion.article;
export const MotionButton = motion.button;
export const MotionSpan = motion.span;
export const MotionTr = motion.tr;
export const MotionUl = motion.ul;
export const MotionLi = motion.li;
export { AnimatePresence };
