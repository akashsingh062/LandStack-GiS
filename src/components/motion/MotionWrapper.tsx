"use client";

import React from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

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

// Reusable animated page wrapper
export function PageMotionWrapper({
  children,
  className = "app-content",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={style}
    >
      {children}
    </motion.div>
  );
}

// Reusable animated list / grid container
export function MotionStaggerContainer({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      style={style}
    >
      {children}
    </motion.div>
  );
}

// Reusable animated card / item
export function MotionCardItem({
  children,
  className = "card",
  style,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <motion.div
      className={className}
      variants={fadeUpItem}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.99 }}
      style={style}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

export { AnimatePresence, motion };
export default PageMotionWrapper;
