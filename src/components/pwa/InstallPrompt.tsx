"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useAppStore } from "@/shared/store/useAppStore";
import { X, Download } from "lucide-react";
import { Logo } from "@/shared/components/Logo";
import { Button } from "@/components/ui/button";

export function InstallPrompt() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const user = useAuthStore((state) => state.user);
  
  const sessionsCount = useAppStore(state => state.sessionsCount);
  const attendanceStreak = useAppStore(state => state.attendanceStreak);
  const hasSeenPwaPrompt = useAppStore(state => state.hasSeenPwaPrompt);
  const setHasSeenPwaPrompt = useAppStore(state => state.setHasSeenPwaPrompt);
  const activePanel = useAppStore(state => state.activePanel);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const installedHandler = () => {
      localStorage.setItem("myfit-pwa-installed", "true");
      setShowPrompt(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  useEffect(() => {
    // Only evaluate if user is logged in and we have a prompt available
    if (!user || !deferredPrompt) return;
    
    // Don't show if already installed or dismissed persistently
    if (localStorage.getItem("myfit-pwa-installed")) return;
    
    // Check engagement criteria: 3+ sessions OR has marked attendance at least once
    const hasEnoughEngagement = sessionsCount >= 3 || attendanceStreak > 0;
    
    // Only show if we haven't shown it yet in this lifecycle, have enough engagement, 
    // and the user is back on the main menu (a safe "discovery" moment)
    if (!hasSeenPwaPrompt && hasEnoughEngagement && activePanel === 'menu' && !showPrompt) {
      // Small delay to ensure it feels discovered after returning to menu
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, deferredPrompt, sessionsCount, attendanceStreak, hasSeenPwaPrompt, activePanel, showPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    setShowPrompt(false);
    setHasSeenPwaPrompt(true);
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      localStorage.setItem("myfit-pwa-installed", "true");
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setHasSeenPwaPrompt(true); // Don't show again this session or until criteria met again
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.2 } }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} // smooth, non-bouncy ease
          className="fixed bottom-safe left-0 right-0 z-[100] p-4 pointer-events-none flex justify-center"
        >
          <div className="w-full max-w-sm bg-black/40 border border-white/5 p-4 rounded-2xl backdrop-blur-xl pointer-events-auto relative overflow-hidden shadow-2xl">
            {/* Soft subtle glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/10 to-transparent rounded-2xl pointer-events-none" />

            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-2 text-white/40 hover:text-white transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-[0.8rem] overflow-hidden">
                  <Logo />
                </div>
                <div>
                  <h3 className="text-zinc-100 font-medium text-sm">Install MYFIT</h3>
                  <p className="text-zinc-500 text-xs mt-0.5">Keep your space native and fast.</p>
                </div>
              </div>

              <Button 
                onClick={handleInstall}
                className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/5 rounded-xl h-10 text-sm font-medium transition-colors shadow-none flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Add to Home Screen
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
