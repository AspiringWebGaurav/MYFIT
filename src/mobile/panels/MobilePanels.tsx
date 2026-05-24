import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useDietStore, useTodayDiet } from "@/shared/store/useDietStore";
import { useAttendanceStore } from "@/shared/store/useAttendanceStore";
import { useAppStore } from "@/shared/store/useAppStore";
import { useWorkoutStore, TrainingType } from "@/shared/store/useWorkoutStore";
// TEST_MODE_ONLY
import { APP_TEST_MODE, getTestCurrentDay } from "@/shared/utils/testMode";
import { useSandboxStore } from "@/shared/store/useSandboxStore";
import { Check, Loader2, Target, Calendar, Fingerprint, Coffee, Edit3, Dumbbell } from "lucide-react";
import { LoginCalendar } from "@/shared/components/LoginCalendar";
import { InstallPwaPrompt } from "@/shared/components/InstallPwaPrompt";

// The Diet Panel - fused into the environment
export function MobileDiet() {
  const { diet, isRecovery, activeType, setDietPreference } = useTodayDiet();

  return (
    <div className="flex flex-col gap-6 p-6 pt-40 text-white">
      <header className="pb-2">
        <h2 className="text-3xl font-semibold tracking-tight">Diet Plan</h2>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-zinc-500 text-sm">Today&apos;s protocol: <span className="text-cyan-400 font-medium">{diet.type}</span></p>
          
          {!isRecovery && (
            <div className="flex bg-white/[0.03] p-1 rounded-full border border-white/[0.08]">
              <button 
                onClick={() => setDietPreference('VEG')}
                className={`px-3 py-1 text-[10px] font-bold tracking-widest rounded-full transition-all ${activeType === 'VEG' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                VEG
              </button>
              <button 
                onClick={() => setDietPreference('NON-VEG')}
                className={`px-3 py-1 text-[10px] font-bold tracking-widest rounded-full transition-all ${activeType === 'NON-VEG' ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                NON-VEG
              </button>
            </div>
          )}
        </div>
      </header>
      
      <div className="flex flex-col gap-4 mt-2">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeType}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {diet.meals.map((meal, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500/50 to-transparent" />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">{meal.meal}</span>
                <span className="text-zinc-200 leading-relaxed text-sm">{meal.food}</span>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
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
    interactionState,
    isHoliday
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
          disabled={isLockedIn || isRegistering || isHoliday}
          whileTap={isLockedIn || isRegistering || isHoliday ? {} : { scale: 0.92 }}
          className={`h-40 w-40 sm:h-44 sm:w-44 shrink-0 rounded-full flex flex-col items-center justify-center relative z-10 transition-all duration-700 outline-none overflow-hidden ${
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
                <Coffee className="h-12 w-12 mb-2 opacity-90 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" strokeWidth={1.5} />
                <span className="text-xs font-bold tracking-widest uppercase opacity-90 leading-snug text-center">REST DAY</span>
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
        <p className="text-zinc-400 text-sm mt-2">Rest up, you&apos;ve earned it.</p>
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

// The Workout Panel
export function MobileWorkout() {
  // TEST_MODE_ONLY forces re-render when global sandbox date changes
  const testDateStr = useSandboxStore(state => APP_TEST_MODE ? state.testDateStr : null);
  const currentDay = APP_TEST_MODE ? getTestCurrentDay() : new Date().getDay();
  
  const weeklyPlan = useWorkoutStore(state => state.weeklyPlan);
  const setDailyPlan = useWorkoutStore(state => state.setDailyPlan);
  const todayPlan = weeklyPlan[currentDay];
  
  const [selectedType, setSelectedType] = useState<TrainingType>(todayPlan.type);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(todayPlan.muscles || []);
  const [isApplying, setIsApplying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Sync state when time-traveling in test mode or advancing days
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedType(todayPlan.type);
    setSelectedMuscles(todayPlan.muscles || []);
    setIsEditing(false); // Reset to view mode when switching days
  }, [currentDay, todayPlan.type, todayPlan.muscles]); // Trigger when day or plan changes

  const trainingTypes: TrainingType[] = ['Dual Muscle', 'Single Muscle', 'Cardio', 'Full Body', 'Recovery'];
  const musclesList = ['Biceps', 'Triceps', 'Chest', 'Back', 'Shoulders', 'Legs', 'Abs'];

  const handleMuscleToggle = (m: string) => {
    setSelectedMuscles(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const handleApply = async () => {
    setIsApplying(true);
    // Simulate premium syncing delay
    await new Promise(r => setTimeout(r, 600));
    setDailyPlan(currentDay, { 
      type: selectedType, 
      muscles: selectedType === 'Recovery' || selectedType === 'Cardio' ? [] : selectedMuscles 
    });
    setIsApplying(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsEditing(false); // Go back to saved view after applying
    }, 2000);
  };

  const getEstimatedDuration = (type: TrainingType) => {
    switch (type) {
      case 'Dual Muscle': return '45–60 min';
      case 'Single Muscle': return '40–50 min';
      case 'Cardio': return '30–45 min';
      case 'Full Body': return '60–75 min';
      case 'Recovery': return '0 min';
      default: return '-- min';
    }
  };

  const isRestDay = todayPlan.dayConfig === 'recovery';

  return (
    <div className="flex flex-col gap-4 p-6 pt-28 text-white h-full pb-24 overflow-hidden relative">
      <header className="pb-2 shrink-0 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Workout Cycle</h2>
          <p className="text-zinc-500 text-sm mt-1">{isEditing ? "Edit Today's Focus" : "Today's Focus"}</p>
        </div>
        {isEditing && todayPlan.type && (
          <button 
            onClick={() => setIsEditing(false)} 
            className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-white/5 px-3 py-2 rounded-full border border-white/10"
          >
            Cancel
          </button>
        )}
      </header>

      {isRestDay ? (
        <div className="flex flex-col items-center justify-center py-20 text-amber-400">
           <Coffee className="h-16 w-16 mb-4 opacity-90 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" strokeWidth={1.5} />
           <h3 className="text-xl font-bold tracking-widest uppercase opacity-90 text-center">Mandatory<br/>Rest Day</h3>
        </div>
      ) : !isEditing && todayPlan.type ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 flex-1 mt-4"
        >
          <div className="p-8 rounded-[32px] bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 relative overflow-hidden flex flex-col items-center text-center shadow-[0_0_30px_rgba(6,182,212,0.1)]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
            
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 relative z-10 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <Dumbbell className="w-8 h-8 text-cyan-400" strokeWidth={1.5} />
            </div>

            <div className="relative z-10 flex flex-col gap-1 w-full">
              <span className="text-xs font-bold text-cyan-400/70 uppercase tracking-widest mb-1">{todayPlan.type}</span>
              <h3 className="text-3xl font-bold tracking-tight text-white leading-tight">
                {todayPlan.type === 'Recovery' ? 'Active Recovery' : 
                 todayPlan.type === 'Cardio' ? 'Cardiovascular' :
                 todayPlan.muscles && todayPlan.muscles.length > 0 ? todayPlan.muscles.join(' + ') : 'Focus'}
              </h3>
              
              <div className="mt-6 flex items-center justify-center gap-2 bg-black/40 py-2.5 px-5 rounded-full border border-white/5 w-max mx-auto">
                <Target className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">{getEstimatedDuration(todayPlan.type)}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsEditing(true)}
            className="w-full h-14 rounded-2xl bg-white/[0.03] text-zinc-300 font-bold tracking-wide border border-white/[0.08] hover:bg-white/[0.06] hover:text-white transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Edit Plan
          </button>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col gap-4 flex-1 mt-2"
        >
          {/* Training Type Selector */}
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Session Type</span>
            <div className="flex flex-wrap gap-2">
              {trainingTypes.map(t => (
                <button
                  key={t!}
                  onClick={() => { setSelectedType(t); setSelectedMuscles([]); }}
                  className={`px-3 py-2 text-[10px] font-bold tracking-widest uppercase rounded-full border transition-all ${
                    selectedType === t 
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                      : 'bg-white/[0.03] text-zinc-400 border-white/[0.08] hover:text-zinc-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Muscle Selector */}
          {(selectedType === 'Dual Muscle' || selectedType === 'Single Muscle' || selectedType === 'Full Body') && (
            <div className="mt-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Target Muscles</span>
              <div className="flex flex-wrap gap-2">
                {musclesList.map(m => (
                  <button
                    key={m}
                    onClick={() => handleMuscleToggle(m)}
                    className={`px-4 py-2.5 rounded-xl border backdrop-blur-md flex-1 min-w-[28%] transition-all ${
                      selectedMuscles.includes(m)
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-white/[0.03] border-white/[0.08] text-zinc-400'
                    }`}
                  >
                    <span className="text-xs font-bold tracking-wide uppercase">{m}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Apply Button with Premium UX */}
          <div className="mt-auto pt-4 shrink-0">
            <motion.button 
              layout
              whileTap={!isApplying && !isSuccess ? { scale: 0.97 } : {}}
              onClick={handleApply}
              disabled={!selectedType || (['Dual Muscle', 'Single Muscle', 'Full Body'].includes(selectedType) && selectedMuscles.length === 0) || isApplying || isSuccess}
              className={`relative w-full h-14 rounded-2xl font-bold tracking-widest uppercase text-xs overflow-hidden transition-all duration-300 ${
                isSuccess
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                  : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)] disabled:opacity-30 disabled:grayscale'
              }`}
            >
              <AnimatePresence mode="wait">
                {isApplying ? (
                  <motion.div
                    key="applying"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-2 h-full"
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                    <span className="text-cyan-300">Syncing...</span>
                  </motion.div>
                ) : isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center justify-center gap-2 h-full drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  >
                    <Check className="w-5 h-5" strokeWidth={3} />
                    <span>Locked In</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center h-full w-full absolute inset-0"
                  >
                    Apply Today's Plan
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Shimmer effect for idle state */}
              {!isApplying && !isSuccess && (
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" />
              )}
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
