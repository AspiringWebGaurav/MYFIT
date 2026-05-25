import { useEffect, useState, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/shared/store/useAppStore';

import { OceanicBackground } from '@/shared/components/OceanicBackground';
import { MobilePanelOverlay } from '../components/MobilePanelOverlay';
import { GlassNavPill } from '../components/GlassNavPill';
import { LiveDateTimeBar } from '@/shared/components/LiveDateTimeBar';
import { TestModeOverlay } from '@/shared/components/TestModeOverlay';

// TEST_MODE_ONLY
import { APP_TEST_MODE } from '@/shared/utils/testMode';

export function MobileShell() {
  const isUnlocked = useAppStore(state => state.isUnlocked);
  const setUnlocked = useAppStore(state => state.setUnlocked);
  const incrementSession = useAppStore(state => state.incrementSession);
  const activePanel = useAppStore(state => state.activePanel);

  // Synchronously restore the active panel from sessionStorage before paint
  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('mobile_active_panel');
      const validPanels = ['menu', 'attendance', 'diet', 'dietVault', 'progress', 'workout', 'settings', 'gymGallery', 'trainingJournal'];
      if (saved && validPanels.includes(saved) && saved !== useAppStore.getState().activePanel) {
        useAppStore.setState({ activePanel: saved as any });
      }
    }
  }, []);

  // Sync active panel changes to sessionStorage, avoiding initial render clobbering
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    sessionStorage.setItem('mobile_active_panel', activePanel);
  }, [activePanel]);

  // Cinematic 1.5s unlock sequence
  useEffect(() => {
    if (!isUnlocked) {
      incrementSession(); // Track session for PWA prompt logic
      const timer = setTimeout(() => {
        setUnlocked(true);
      }, 100); // Trigger the reveal almost immediately, letting Framer Motion handle the 1.5s visual unlock
      return () => clearTimeout(timer);
    }
  }, [isUnlocked, setUnlocked, incrementSession]);

  return (
    <div className="relative flex flex-col h-[100dvh] w-full bg-[#020B1A] text-zinc-100 overflow-hidden select-none">
      {/* 1. Persistent Oceanic Background Layer */}
      <OceanicBackground interactive={false} variant="full" />

      {/* 2. Main Content & Unlock Sequence */}
      <AnimatePresence>
        {!isUnlocked ? (
          <motion.div
            key="lock-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-50 bg-black"
          />
        ) : (
          <motion.div
            key="app-content"
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-10"
          >
            {/* Live Date Time Bar (Top Centered) */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
              style={{ top: 'calc(var(--safe-top) + var(--header-top-padding))', height: 'var(--datetime-height)' }}
            >
              <div className="pointer-events-auto scale-[0.85] sm:scale-95 origin-top drop-shadow-lg">
                <LiveDateTimeBar />
              </div>
            </div>

            <MobilePanelOverlay />
            <GlassNavPill />

            {/* TEST_MODE_ONLY */}
            <TestModeOverlay />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
