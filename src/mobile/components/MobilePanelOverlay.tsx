import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/shared/store/useAppStore';
import { MobileAttendance, MobileDiet, MobileSettings } from '../panels/MobilePanels';
import { MenuHub } from './MenuHub';

export function MobilePanelOverlay() {
  const activePanel = useAppStore(state => state.activePanel);

  return (
    <div className="relative w-full h-full">
      {/* Background Menu Hub layer - scales down and dims when a panel is open */}
      <motion.div
        animate={{
          scale: activePanel === 'menu' ? 1 : 0.95,
          opacity: activePanel === 'menu' ? 1 : 0.3,
          filter: activePanel === 'menu' ? 'blur(0px)' : 'blur(4px)',
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 z-10"
        style={{ pointerEvents: activePanel === 'menu' ? 'auto' : 'none' }}
      >
        <MenuHub />
      </motion.div>

      {/* Foreground Panels */}
      <AnimatePresence mode="wait">
        {activePanel !== 'menu' && (
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, y: 100, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute inset-0 z-20 ${activePanel === 'diet' ? 'overflow-y-auto hide-scrollbar' : 'overflow-hidden'} bg-black/40 backdrop-blur-md`}
          >
            {/* Soft gradient from top to blend the overlay */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
            
            <div className={`min-h-full flex flex-col ${activePanel === 'diet' ? 'pb-24' : 'pb-6'}`}>
              {activePanel === 'attendance' && <MobileAttendance />}
              {activePanel === 'diet' && <MobileDiet />}
              {activePanel === 'settings' && <MobileSettings />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
