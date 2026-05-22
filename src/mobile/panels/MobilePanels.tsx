import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useDietStore } from "@/shared/store/useDietStore";
import { useAttendanceStore } from "@/shared/store/useAttendanceStore";
import { useAppStore } from "@/shared/store/useAppStore";
import { CheckCircle2, Loader2, Target, Calendar } from "lucide-react";
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
export function MobileAttendance() {
  const user = useAuthStore(state => state.user);
  const isAttendedToday = useAttendanceStore(state => state.isAttendedToday);
  const loading = useAttendanceStore(state => state.loading);
  const checkAttendanceStatus = useAttendanceStore(state => state.checkAttendanceStatus);
  const markAttendance = useAttendanceStore(state => state.markAttendance);
  const incrementStreak = useAppStore(state => state.incrementStreak);
  
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (user) {
      checkAttendanceStatus(user.uid);
    }
  }, [user, checkAttendanceStatus]);

  const handleMarkAttendance = async () => {
    if (user && !isAttendedToday) {
      await markAttendance(user.uid);
      incrementStreak(); // Track for PWA logic
      
      // Trigger the emotional world reaction
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 2000);
    }
  };

  return (
    <div className="flex flex-col flex-1 p-6 pt-40 items-center text-center relative">
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

      <div className="shrink-0 w-full mt-2">
        <h2 className="text-3xl font-semibold tracking-tight text-white mb-2 relative z-10">Daily Login</h2>
        <p className="text-zinc-500 text-sm relative z-10">Lock in your discipline.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[200px] gap-3 mt-2">
        <motion.div 
          layout
          className={`h-28 w-28 sm:h-32 sm:w-32 shrink-0 rounded-full flex flex-col items-center justify-center relative z-10 transition-colors duration-1000 ${
            isAttendedToday ? 'bg-cyan-500/5 border border-cyan-500/20' : 'bg-white/[0.02] border border-white/5'
          }`}
        >
        {loading ? (
          <Loader2 className="h-8 w-8 text-zinc-600 animate-spin" />
        ) : isAttendedToday ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <CheckCircle2 className="h-10 w-10 text-cyan-400 mb-1 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
            <span className="text-cyan-100 text-sm font-medium tracking-wide">Locked In</span>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center opacity-40">
            <Target className="h-8 w-8 text-zinc-500 mb-1" />
            <span className="text-zinc-500 text-xs font-medium tracking-widest uppercase">Pending</span>
          </div>
        )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-sm relative z-10 mt-2"
        >
          <LoginCalendar compact />
        </motion.div>
      </div>

      <div className="w-full shrink-0 relative z-10 mt-6">
        <motion.button 
          whileTap={isAttendedToday || loading ? {} : { scale: 0.98 }}
          onClick={handleMarkAttendance}
          disabled={isAttendedToday || loading}
          className={`w-full h-14 rounded-2xl font-medium tracking-wide transition-all duration-500 flex items-center justify-center ${
            isAttendedToday 
              ? 'bg-transparent text-cyan-500/50 cursor-default' 
              : 'bg-white text-black hover:bg-zinc-200'
          }`}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : isAttendedToday ? 'Login Complete' : 'Lock In'}
        </motion.button>
      </div>
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
