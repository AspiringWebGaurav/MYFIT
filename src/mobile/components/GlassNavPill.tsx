import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useAppStore } from '@/shared/store/useAppStore';

export function GlassNavPill() {
  const setActivePanel = useAppStore(state => state.setActivePanel);
  const activePanel = useAppStore(state => state.activePanel);

  if (activePanel === 'menu') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="absolute left-0 right-0 z-50 flex justify-center pointer-events-none"
      style={{ top: 'env(safe-area-inset-top, 24px)', marginTop: '64px' }}
    >
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setActivePanel('menu')}
        className="pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-zinc-300 hover:text-white hover:bg-black/60 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm font-medium tracking-tight">Menu</span>
      </motion.button>
    </motion.div>
  );
}
