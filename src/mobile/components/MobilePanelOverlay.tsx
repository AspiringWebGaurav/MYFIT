import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/shared/store/useAppStore';
import { MobileAttendance, MobileDiet, MobileDietVault, MobileSettings, MobileWorkout } from '../panels/MobilePanels';
import { MobileGymGallery } from '../panels/MobileGymGallery';
import { MobileTrainingJournal } from './MobileTrainingJournal';
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
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 z-10"
        style={{ 
          pointerEvents: activePanel === 'menu' ? 'auto' : 'none',
          willChange: 'transform, opacity'
        }}
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
            className={`absolute inset-0 z-20 overflow-hidden bg-[#020B1A]`}
            style={{ transform: 'translateZ(0)' }}
          >
            <div className={`h-full w-full flex flex-col`}>
              {activePanel === 'attendance' && <MobileAttendance />}
              {activePanel === 'diet' && <MobileDiet />}
              {activePanel === 'dietVault' && <MobileDietVault />}
              {activePanel === 'settings' && <MobileSettings />}
              {activePanel === 'workout' && <MobileWorkout />}
              {activePanel === 'gymGallery' && <MobileGymGallery />}
              {activePanel === 'trainingJournal' && <MobileTrainingJournal />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
