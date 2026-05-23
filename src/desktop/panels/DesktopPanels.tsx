import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useDietStore, useTodayDiet } from "@/shared/store/useDietStore";
import { useAttendanceStore } from "@/shared/store/useAttendanceStore";
import { useAppStore } from "@/shared/store/useAppStore";
import { CheckCircle2, Check, Loader2, Calendar, Fingerprint, Coffee } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginCalendar } from "@/shared/components/LoginCalendar";

export function DesktopDashboard() {
  const user = useAuthStore(state => state.user);
  const { diet, isRecovery, activeType, setDietPreference } = useTodayDiet();
  const isAttendedToday = useAttendanceStore(state => state.isAttendedToday);
  const isHoliday = new Date().getDay() === 0;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-semibold tracking-tight text-white">Welcome back, {user?.displayName?.split(' ')[0] || 'Gaurav'}</h2>
        <p className="text-zinc-400 mt-1">Here&apos;s your fitness overview for today.</p>
      </header>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2 p-6 bg-[#0b1620a8] border-cyan-400/10 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-zinc-100">Today&apos;s Diet</h3>
            {isRecovery ? (
              <span className="px-3 py-1 bg-[#10202cb5] border border-cyan-400/10 text-amber-400 text-xs font-bold tracking-widest rounded-full uppercase">RECOVERY</span>
            ) : (
              <div className="flex bg-[#10202cb5] p-1 rounded-full border border-cyan-400/10">
                <button 
                  onClick={() => setDietPreference('VEG')}
                  className={`px-4 py-1 text-xs font-bold tracking-widest rounded-full transition-all ${activeType === 'VEG' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  VEG
                </button>
                <button 
                  onClick={() => setDietPreference('NON-VEG')}
                  className={`px-4 py-1 text-xs font-bold tracking-widest rounded-full transition-all ${activeType === 'NON-VEG' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  NON-VEG
                </button>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeType}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {diet.meals.map((meal, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-cyan-400/10 pb-4 last:border-0 last:pb-0">
                    <span className="text-zinc-400 text-sm font-medium">{meal.meal}</span>
                    <span className="text-zinc-200 text-sm">{meal.food}</span>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </Card>

        <Card className="col-span-1 p-6 bg-[#0b1620a8] border-cyan-400/10 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl flex flex-col">
          <h3 className="text-lg font-medium text-zinc-100 mb-6 text-center">Gym Attendance</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className={`h-40 w-40 rounded-full flex flex-col items-center justify-center mb-6 transition-all duration-700 outline-none overflow-hidden ${
              isHoliday
                ? 'bg-amber-500/10 shadow-[0_0_30px_rgba(251,191,36,0.1)]'
                : isAttendedToday 
                  ? 'bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.15)]' 
                  : 'bg-white/[0.03] shadow-[0_0_20px_rgba(255,255,255,0.03)]'
            }`}>
              {isHoliday ? (
                <>
                  <Coffee className="h-10 w-10 text-amber-400 mb-2 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" strokeWidth={1.5} />
                  <span className="text-amber-100 text-sm font-bold tracking-widest uppercase opacity-90 leading-snug text-center">REST DAY</span>
                </>
              ) : isAttendedToday ? (
                <>
                  <Check className="h-10 w-10 text-cyan-400 mb-2 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" strokeWidth={3} />
                  <span className="text-cyan-100 text-sm font-semibold tracking-wide uppercase">LOCKED IN</span>
                </>
              ) : (
                <>
                  <Fingerprint className="h-10 w-10 text-zinc-400 mb-2 opacity-80" strokeWidth={1.5} />
                  <span className="text-zinc-400 text-xs font-bold tracking-widest uppercase opacity-80 leading-snug text-center">Pending</span>
                </>
              )}
            </div>
            <p className="text-zinc-400 text-sm text-center">
              {isHoliday ? "Mandatory recovery day. Rest up!" : isAttendedToday ? "You've crushed it today!" : "Don't forget to hit the gym."}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function DesktopDiet() {
  const { diet, isRecovery, activeType, setDietPreference } = useTodayDiet();

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-semibold tracking-tight text-white">Diet Plan</h2>
        <p className="text-zinc-400 mt-1">Strict adherence leads to results.</p>
      </header>

      <Card className="p-8 bg-[#0b1620a8] border-cyan-400/10 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-cyan-400/10">
          <div className="flex items-center gap-3">
            <Calendar className="text-zinc-400 h-5 w-5" />
            <h3 className="text-xl font-medium text-zinc-100">Today&apos;s Schedule</h3>
          </div>
          {isRecovery ? (
            <span className="px-4 py-1.5 bg-amber-500/20 text-amber-400 text-sm font-bold tracking-widest uppercase rounded-full border border-amber-500/20">RECOVERY</span>
          ) : (
            <div className="flex bg-[#10202cb5] p-1 rounded-full border border-cyan-400/10">
              <button 
                onClick={() => setDietPreference('VEG')}
                className={`px-6 py-1.5 text-sm font-bold tracking-widest rounded-full transition-all ${activeType === 'VEG' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                VEG
              </button>
              <button 
                onClick={() => setDietPreference('NON-VEG')}
                className={`px-6 py-1.5 text-sm font-bold tracking-widest rounded-full transition-all ${activeType === 'NON-VEG' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                NON-VEG
              </button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeType}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 gap-6"
            >
              {diet.meals.map((meal, i) => (
                <div key={i} className="flex flex-col gap-1 p-4 rounded-xl hover:bg-[#10202cb5] border border-transparent hover:border-cyan-400/10 transition-all">
                  <span className="text-zinc-500 text-sm font-medium uppercase tracking-wider">{meal.meal}</span>
                  <span className="text-zinc-100 text-lg">{meal.food}</span>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}

import { useAttendanceFlow } from '@/shared/hooks/useAttendanceFlow';

export function DesktopAttendance() {
  const {
    handleMarkAttendance,
    showPulse,
    isLockedIn,
    isRegistering,
    interactionState,
    isHoliday
  } = useAttendanceFlow();

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden relative">
      <AnimatePresence>
        {showPulse && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 2 }}
            exit={{ opacity: 0, scale: 3 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"
          />
        )}
      </AnimatePresence>

      <header className="shrink-0">
        <h2 className="text-3xl font-semibold tracking-tight text-white mb-2 relative z-10">Daily Login</h2>
        <p className="text-zinc-500 text-sm relative z-10">Lock in your discipline.</p>
      </header>

      <div className="flex-1 flex gap-16 items-center justify-center mt-8 pb-10 w-full max-w-5xl mx-auto">
        
        {/* Left Side: Interactive Circle */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <motion.button 
            layout
            onClick={handleMarkAttendance}
            disabled={isLockedIn || isRegistering || isHoliday}
            whileTap={isLockedIn || isRegistering || isHoliday ? {} : { scale: 0.92 }}
            className={`h-56 w-56 lg:h-64 lg:w-64 shrink-0 rounded-full flex flex-col items-center justify-center relative transition-all duration-700 outline-none overflow-hidden ${
              isHoliday
                ? 'bg-amber-500/10 shadow-[0_0_30px_rgba(251,191,36,0.1)] cursor-default'
                : isLockedIn 
                  ? 'bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.15)] cursor-default' 
                  : isRegistering
                    ? 'bg-cyan-500/5 shadow-[0_0_40px_rgba(6,182,212,0.2)]'
                    : 'bg-white/[0.03] hover:bg-white/[0.06] shadow-[0_0_20px_rgba(255,255,255,0.03)]'
            }`}
          >
            <AnimatePresence mode="wait">
              {isHoliday ? (
                <motion.div
                  key="holiday"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center text-amber-400 transition-colors"
                >
                  <Coffee className="h-16 w-16 mb-3 opacity-90 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" strokeWidth={1.5} />
                  <span className="text-sm font-bold tracking-widest uppercase opacity-90 leading-snug text-center">REST DAY</span>
                </motion.div>
              ) : isRegistering ? (
                <motion.div
                  key="registering"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center"
                >
                  <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mb-3 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                  <span className="text-cyan-400 text-xs font-bold tracking-widest uppercase animate-pulse">Registering</span>
                </motion.div>
              ) : isLockedIn ? (
                <motion.div
                  key="locked"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <Check className="h-14 w-14 text-cyan-400 mb-3 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" strokeWidth={3} />
                  <span className="text-cyan-100 text-base font-semibold tracking-wide">LOCKED IN</span>
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
                  <Fingerprint className="h-16 w-16 mb-3 opacity-80" strokeWidth={1.5} />
                  <span className="text-sm font-bold tracking-widest uppercase opacity-80 leading-snug text-center">Click to<br/>Punch</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Right Side: Calendar */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 max-w-[400px] shrink-0 relative z-10"
        >
          <LoginCalendar />
        </motion.div>
      </div>
    </div>
  );
}
