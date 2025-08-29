import React from "react";
import { motion } from "framer-motion";
import "../Styles/WebsiteComingSoon.css"

const FeatureComingSoon = () => {
  return (
    <div className="coming-soon-container">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="coming-soon-content"
      >
        <motion.h1
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          🚀 Coming Soon
        </motion.h1>
        <p>We’re working hard to launch something amazing. Stay tuned!</p>

        {/* Animated Dots */}
        <div className="dots">
          <motion.span
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
          />
          <motion.span
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
          />
          <motion.span
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default FeatureComingSoon;
