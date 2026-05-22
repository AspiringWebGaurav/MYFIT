import React from 'react';
import { motion } from 'framer-motion';

interface GlobalLoaderProps {
  fullScreen?: boolean;
  message?: string | null;
}

export const GlobalLoader: React.FC<GlobalLoaderProps> = ({ fullScreen = true, message }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`
        flex flex-col items-center justify-center 
        ${fullScreen ? 'fixed top-0 left-0 w-full h-[100dvh] z-[9999]' : 'w-full h-full min-h-[200px] relative rounded-lg'}
        bg-[#020B1A] 
        overflow-hidden 
        pointer-events-none // Ensures interactions aren't blocked on the app behind it during the exit fade
      `}
      style={{
        backgroundImage: 'radial-gradient(circle at center, rgba(20, 30, 48, 0.6) 0%, rgba(2, 11, 26, 1) 100%)',
        willChange: 'opacity'
      }}
    >
      <div className="absolute inset-0 backdrop-blur-[4px] pointer-events-none" />

      <motion.div 
        className="relative z-10 flex flex-col items-center justify-center pointer-events-auto"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.02, opacity: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        style={{ willChange: 'transform, opacity' }}
      >
        {/* Premium minimal 'M' Logo Mark */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Breathing opacity effect */}
          <motion.div 
            className="absolute inset-0 rounded-full bg-cyan-500/5 mix-blend-screen"
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
            style={{ willChange: 'transform, opacity' }}
          />
          
          <svg
            width="40"
            height="40"
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10"
          >
            <motion.rect 
              width="512" height="512" rx="128" 
              fill="url(#premium-gradient)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.path
              d="M128 384V128L256 256L384 128V384"
              stroke="white"
              strokeWidth="48"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
            <defs>
              <linearGradient id="premium-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {message && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-xs tracking-[0.2em] text-cyan-500/50 uppercase font-medium"
            style={{ fontFeatureSettings: '"tnum" on, "lnum" on', willChange: 'transform, opacity' }}
          >
            {message}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};
