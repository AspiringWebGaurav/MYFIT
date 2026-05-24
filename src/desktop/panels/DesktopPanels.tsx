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
import { getGlobalDate, APP_TEST_MODE, getTestCurrentDay } from "@/shared/utils/testMode";
import { useSandboxStore } from "@/shared/store/useSandboxStore";
import { useWorkoutStore, TrainingType } from "@/shared/store/useWorkoutStore";
import { Target, Edit3, Dumbbell } from "lucide-react";

export function DesktopDashboard() {
  const user = useAuthStore(state => state.user);
  const { diet, isRecovery, activeType, setDietPreference } = useTodayDiet();
  const isAttendedToday = useAttendanceStore(state => state.isAttendedToday);
  const isHoliday = getGlobalDate().getDay() === 0;

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

// The Desktop Workout Panel
export function DesktopWorkout() {
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
  }, [currentDay, todayPlan.type, todayPlan.muscles, testDateStr]);

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
    <div className="flex flex-col gap-6 h-full pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-start justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-white">Workout Cycle</h2>
          <p className="text-zinc-400 mt-1">{isEditing ? "Edit Today's Focus" : "Today's Focus"}</p>
        </div>
        {isEditing && todayPlan.type && (
          <Button 
            variant="outline"
            onClick={() => setIsEditing(false)} 
            className="bg-[#10202cb5] text-zinc-300 border-cyan-400/10 hover:bg-[#152a3bb5] hover:text-white"
          >
            Cancel Edit
          </Button>
        )}
      </header>

      <Card className="p-8 bg-[#0b1620a8] border-cyan-400/10 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl flex-1 flex flex-col overflow-hidden min-h-0">
        {isRestDay ? (
          <div className="flex-1 flex flex-col items-center justify-center text-amber-400">
             <Coffee className="h-20 w-20 mb-6 opacity-90 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" strokeWidth={1.5} />
             <h3 className="text-2xl font-bold tracking-widest uppercase opacity-90 text-center">Mandatory<br/>Rest Day</h3>
          </div>
        ) : !isEditing && todayPlan.type ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6 flex-1 items-center justify-center overflow-hidden"
          >
            <div className="p-8 md:p-10 w-full max-w-2xl rounded-[32px] bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 relative overflow-hidden flex flex-col items-center text-center shadow-[0_0_30px_rgba(6,182,212,0.1)]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
              
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 relative z-10 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <Dumbbell className="w-8 h-8 text-cyan-400" strokeWidth={1.5} />
              </div>

              <div className="relative z-10 flex flex-col gap-2 w-full">
                <span className="text-sm font-bold text-cyan-400/70 uppercase tracking-widest mb-1">{todayPlan.type}</span>
                <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                  {todayPlan.type === 'Recovery' ? 'Active Recovery' : 
                   todayPlan.type === 'Cardio' ? 'Cardiovascular' :
                   todayPlan.muscles && todayPlan.muscles.length > 0 ? todayPlan.muscles.join(' + ') : 'Focus'}
                </h3>
                
                <div className="mt-6 flex items-center justify-center gap-2 bg-black/40 py-2.5 px-6 rounded-full border border-white/5 w-max mx-auto">
                  <Target className="w-5 h-5 text-zinc-400" />
                  <span className="text-base font-medium text-zinc-300">{getEstimatedDuration(todayPlan.type)}</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setIsEditing(true)}
              className="h-12 px-10 rounded-2xl bg-[#10202cb5] text-zinc-300 font-bold tracking-wide border border-cyan-400/10 hover:bg-[#152a3bb5] hover:text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              <Edit3 className="w-5 h-5" />
              Edit Today's Plan
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-6 flex-1 w-full max-w-4xl mx-auto overflow-hidden"
          >
            {/* Training Type Selector */}
            <div className="shrink-0">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Session Type</span>
              <div className="flex flex-wrap gap-2">
                {trainingTypes.map(t => (
                  <button
                    key={t!}
                    onClick={() => { setSelectedType(t); setSelectedMuscles([]); }}
                    className={`px-5 py-3 text-sm font-bold tracking-widest uppercase rounded-full border transition-all ${
                      selectedType === t 
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                        : 'bg-[#10202cb5] text-zinc-400 border-cyan-400/10 hover:text-zinc-200 hover:bg-[#152a3bb5]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Muscle Selector */}
            {(selectedType === 'Dual Muscle' || selectedType === 'Single Muscle' || selectedType === 'Full Body') && (
              <div className="shrink-0">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Target Muscles</span>
                <div className="flex flex-wrap gap-2">
                  {musclesList.map(m => (
                    <button
                      key={m}
                      onClick={() => handleMuscleToggle(m)}
                      className={`px-4 py-3 rounded-xl border flex-1 min-w-[120px] transition-all ${
                        selectedMuscles.includes(m)
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                          : 'bg-[#10202cb5] border-cyan-400/10 text-zinc-400 hover:bg-[#152a3bb5]'
                      }`}
                    >
                      <span className="text-sm font-bold tracking-wide uppercase">{m}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Apply Button with Premium UX */}
            <div className="mt-auto pt-4 flex justify-end shrink-0">
              <motion.button 
                layout
                whileTap={!isApplying && !isSuccess ? { scale: 0.97 } : {}}
                onClick={handleApply}
                disabled={!selectedType || (['Dual Muscle', 'Single Muscle', 'Full Body'].includes(selectedType) && selectedMuscles.length === 0) || isApplying || isSuccess}
                className={`relative h-14 px-12 rounded-2xl font-bold tracking-widest uppercase text-sm overflow-hidden transition-all duration-300 ${
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
                      className="flex items-center justify-center gap-3 h-full"
                    >
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-300" />
                      <span className="text-cyan-300">Syncing...</span>
                    </motion.div>
                  ) : isSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center justify-center gap-3 h-full drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                    >
                      <Check className="w-6 h-6" strokeWidth={3} />
                      <span>Locked In</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center h-full"
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
      </Card>
    </div>
  );
}
