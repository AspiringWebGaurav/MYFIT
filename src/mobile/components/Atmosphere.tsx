import { motion } from 'framer-motion';

export function Atmosphere() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black">
      {/* Deep dark base to ensure deep blacks */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#010306] to-black" />

      {/* Subtle ambient lighting - very slow drift */}
      <motion.div
        className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] opacity-30"
        animate={{
          x: ['0%', '-15%', '0%'],
          y: ['0%', '-15%', '0%'],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.05) 0%, transparent 60%)',
          willChange: 'transform',
        }}
      />

      {/* Breathing glow at the bottom */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[60vh] bg-gradient-to-t from-cyan-900/10 to-transparent"
        animate={{
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}
