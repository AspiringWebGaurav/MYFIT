import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useDietStore } from "@/shared/store/useDietStore";
import { useAttendanceStore } from "@/shared/store/useAttendanceStore";
import { useAppStore } from "@/shared/store/useAppStore";
import { Check, Loader2, Target, Calendar, Fingerprint } from "lucide-react";
import { LoginCalendar } from "@/shared/components/LoginCalendar";
import { InstallPwaPrompt } from "@/shared/components/InstallPwaPrompt";

// The Diet Panel - fused into the environment
export function MobileDiet() {
  const diet = useDietStore(state => state.getDietForToday());

  return (
    <div className="flex flex-col gap-6 p-6 pt-40 text-white">
      <header className="pb-2">
        <h2 className="text-3xl font-semibold tracking-tight">Diet Plan</h2>
        <p className="text-zinc-500 text-sm mt-1">Today&apos;s protocol: <span className="text-cyan-400 font-medium">{diet.type}</span></p>
      </header>
      
      <div className="flex flex-col gap-4 mt-4">
        {diet.meals.map((meal, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500/50 to-transparent" />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">{meal.meal}</span>
            <span className="text-zinc-200 leading-relaxed text-sm">{meal.food}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// The Attendance Panel - Core emotional loop
import { useAttendanceFlow } from '@/shared/hooks/useAttendanceFlow';

export function MobileAttendance() {
  const {
    handleMarkAttendance,
    showPulse,
    isLockedIn,
    isRegistering,
    interactionState
  } = useAttendanceFlow();

  return (
    <div className="flex flex-col h-full flex-1 px-6 pt-32 pb-8 items-center text-center relative justify-between overflow-hidden">
      {/* Emotional Pulse Layer */}
      <AnimatePresence>
        {showPulse && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 2 }}
            exit={{ opacity: 0, scale: 3 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="shrink-0 w-full">
        <h2 className="text-3xl font-semibold tracking-tight text-white mb-2 relative z-10">Daily Login</h2>
        <p className="text-zinc-500 text-sm relative z-10">Lock in your discipline.</p>
      </div>

      {/* Center Interactive Circle */}
      <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[180px]">
        <motion.button 
          layout
          onClick={handleMarkAttendance}
          disabled={isLockedIn || isRegistering}
          whileTap={isLockedIn || isRegistering ? {} : { scale: 0.92 }}
          className={`h-40 w-40 sm:h-44 sm:w-44 shrink-0 rounded-full flex flex-col items-center justify-center relative z-10 transition-all duration-700 outline-none overflow-hidden ${
            isLockedIn 
              ? 'bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.15)] cursor-default' 
              : isRegistering
                ? 'bg-cyan-500/5 shadow-[0_0_40px_rgba(6,182,212,0.2)]'
                : 'bg-white/[0.03] hover:bg-white/[0.06] shadow-[0_0_20px_rgba(255,255,255,0.03)]'
          }`}
        >
          <AnimatePresence mode="wait">
            {isRegistering ? (
              <motion.div
                key="registering"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <Loader2 className="h-10 w-10 text-cyan-400 animate-spin mb-2 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                <span className="text-cyan-400 text-[10px] font-bold tracking-widest uppercase animate-pulse">Registering</span>
              </motion.div>
            ) : isLockedIn ? (
              <motion.div
                key="locked"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="flex flex-col items-center"
              >
                <Check className="h-10 w-10 text-cyan-400 mb-2 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" strokeWidth={3} />
                <span className="text-cyan-100 text-sm font-semibold tracking-wide">LOCKED IN</span>
              </motion.div>
            ) : (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center text-zinc-400 group-hover:text-zinc-200 transition-colors"
              >
                <Fingerprint className="h-12 w-12 mb-2 opacity-80" strokeWidth={1.5} />
                <span className="text-xs font-bold tracking-widest uppercase opacity-80 leading-snug">Touch to<br/>Punch</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* The Calendar at Bottom */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full shrink-0 max-w-sm relative z-10"
      >
        <LoginCalendar compact />
      </motion.div>
    </div>
  );
}

// The Settings Panel
export function MobileSettings() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const setActivePanel = useAppStore(state => state.setActivePanel);

  const handleLogout = async () => {
    await logout();
    setActivePanel('menu'); // Optional: reset to menu after logout
  };

  return (
    <div className="flex flex-col flex-1 p-6 pt-40 text-white">
      <header className="pb-2">
        <h2 className="text-3xl font-semibold tracking-tight">Settings</h2>
        <p className="text-zinc-500 text-sm mt-1">Manage your space.</p>
      </header>
      
      <div className="flex flex-col gap-4 mt-4 flex-1">
        {/* Future settings items will go here */}
      </div>

      <div className="shrink-0 pt-8 mt-auto">
        <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
          <p className="text-zinc-400 text-sm mb-4 text-center">Logged in as <br/><span className="text-white">{user?.email}</span></p>
          <div className="flex flex-col gap-3">
            <InstallPwaPrompt variant="mobile" />
            <button 
              onClick={handleLogout}
              className="w-full h-12 rounded-xl bg-red-500/10 text-red-500 font-medium tracking-wide border border-red-500/20 active:scale-95 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
