import React from 'react';
import { motion } from 'framer-motion';
import { pageTransitionVariants } from '../../animations/motionVariants';

/**
 * AnimatedPage Component
 * Provides smooth, flicker-free route entrance animations
 */
export const AnimatedPage = ({ children, className = '' }) => {
  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`cx-animated-page ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;
