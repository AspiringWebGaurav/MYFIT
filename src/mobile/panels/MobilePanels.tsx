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

import { useDietVaultStore } from "@/shared/store/useDietVaultStore";
import { useDietVaultStorage } from "@/shared/hooks/useDietVaultStorage";
import { FileText, Download, Upload, Eye, X, RefreshCw } from "lucide-react";
import { useRef, useCallback } from "react";
import { MobilePageWrapper } from "../components/layout/MobilePageWrapper";

export function MobileDietVault() {
  const user = useAuthStore(state => state.user);
  
  const { dietPlan, subscribeToPlan, unsubscribeFromPlan, isLoading } = useDietVaultStore();
  const { uploadDiet, downloadDiet, isUploading, uploadProgress, isUploaded, downloadState } = useDietVaultStorage();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewingPdf, setViewingPdf] = useState(false);

  useEffect(() => {
    if (user) {
      subscribeToPlan(user.uid);
    }
    return () => unsubscribeFromPlan();
  }, [user, subscribeToPlan, unsubscribeFromPlan]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      await uploadDiet(file, user.uid);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error(error);
      alert('Upload failed. Please try again.');
    }
  }, [user, uploadDiet]);

  const handleDownload = useCallback(async () => {
    if (!dietPlan) return;
    await downloadDiet(dietPlan.storagePath, dietPlan.fileName);
  }, [dietPlan, downloadDiet]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <MobilePageWrapper 
      title="Diet Vault" 
      subtitle="Your active nutrition protocol"
      contentClassName="flex flex-col gap-4"
    >
      <input 
        type="file" 
        accept="application/pdf" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange} 
      />

      {viewingPdf && dietPlan && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed inset-0 z-[60] bg-[#020B1A] flex flex-col pt-12 pb-6 px-4"
        >
          <div className="flex justify-between items-center mb-4 shrink-0 px-2">
            <div>
              <h3 className="font-semibold">{dietPlan.fileName}</h3>
              <p className="text-xs text-zinc-500">v{dietPlan.version}</p>
            </div>
            <button 
              onClick={() => setViewingPdf(false)}
              className="p-2 bg-white/10 rounded-full text-zinc-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
            <iframe 
              src={`${dietPlan.fileUrl}#view=FitH`} 
              className="w-full h-full border-none bg-zinc-900"
              title="Diet Plan PDF"
            />
          </div>
        </motion.div>
      )}
      
      <div className="flex flex-col gap-4 mt-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
        ) : !dietPlan ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-xl font-medium text-zinc-300">No Active Diet Plan</h3>
            <p className="text-sm text-zinc-500 mt-2 mb-8">Upload your first diet plan</p>
            
            <button 
              onClick={handleUploadClick}
              disabled={isUploading || isUploaded}
              className={`w-full max-w-[200px] py-3.5 rounded-2xl border backdrop-blur-md font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                isUploaded 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-white/[0.02] border-white/10 text-zinc-300 hover:text-zinc-100 hover:bg-white/5 disabled:opacity-50'
              }`}
            >
              <AnimatePresence mode="wait">
                {isUploading ? (
                  <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 w-full px-4">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                    <div className="flex-1 bg-white/10 h-1 rounded-full overflow-hidden">
                      <div className="bg-cyan-400 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </motion.div>
                ) : isUploaded ? (
                  <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Uploaded ✓</span>
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Upload PDF</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500/50 to-transparent" />
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-200 line-clamp-1">{dietPlan.fileName}</h4>
                  <p className="text-[10px] uppercase tracking-wider text-cyan-500 font-bold mt-0.5">Version {dietPlan.version}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Uploaded</p>
                <p className="text-sm text-zinc-300">{new Date(dietPlan.uploadedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Size</p>
                <p className="text-sm text-zinc-300">{formatFileSize(dietPlan.fileSize)}</p>
              </div>
            </div>

            <AnimatePresence>
              {(downloadState.message && downloadState.status !== 'success') && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-3 mb-4 rounded-xl border flex flex-col items-center text-center overflow-hidden ${
                    downloadState.status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                    'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}
                >
                  <span className="font-bold text-sm">{downloadState.message}</span>
                  {downloadState.subMessage && <span className="opacity-80 mt-1 text-xs">{downloadState.subMessage}</span>}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2">
              <button 
                onClick={() => setViewingPdf(true)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                View
              </button>
              
              <button 
                onClick={handleDownload}
                disabled={downloadState.status !== 'idle' && downloadState.status !== 'error'}
                className={`flex-1 py-3 rounded-xl border font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                  downloadState.status === 'success' 
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : downloadState.status === 'error'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-400 disabled:opacity-50'
                }`}
              >
                <AnimatePresence mode="wait">
                  {downloadState.status === 'preparing' ? (
                    <motion.div key="preparing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                      <span>Preparing...</span>
                    </motion.div>
                  ) : (downloadState.status === 'downloading' || downloadState.status === 'slow' || downloadState.status === 'retry') ? (
                    <motion.div key="downloading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                      <span>{downloadState.progress > 0 ? `Downloading ${downloadState.progress}%` : 'Downloading...'}</span>
                    </motion.div>
                  ) : downloadState.status === 'success' ? (
                    <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Saved ✓</span>
                    </motion.div>
                  ) : downloadState.status === 'error' ? (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Retry</span>
                    </motion.div>
                  ) : (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Download</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              <button 
                onClick={handleUploadClick}
                disabled={isUploading}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                {isUploading ? 'Syncing...' : 'Replace'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </MobilePageWrapper>
  );
}

// FUTURE_DESKTOP_SYNC
// The Diet Panel - fused into the environment
export function MobileDiet() {
  const { diet, isRecovery, activeType, setDietPreference } = useTodayDiet();

  return (
    <MobilePageWrapper 
      title="Diet Plan" 
      subtitle={<span>Today&apos;s protocol: <span className="text-cyan-400 font-medium">{diet.type}</span></span>}
      headerRight={!isRecovery && (
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
      contentClassName="flex flex-col gap-4"
    >
      
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
    </MobilePageWrapper>
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
    <MobilePageWrapper 
      title="Daily Login"
      subtitle="Lock in your discipline."
      contentClassName="flex flex-col items-center text-center justify-between h-full relative"
    >
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
    </MobilePageWrapper>
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
    <MobilePageWrapper 
      title="Settings"
      subtitle="Rest up, you've earned it."
      contentClassName="flex flex-col"
    >
      
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
    </MobilePageWrapper>
  );
}

// The Workout Panel
const trainingTypes: TrainingType[] = ['Dual Muscle', 'Single Muscle', 'Cardio', 'Full Body', 'Recovery'];
const musclesList = ['Biceps', 'Triceps', 'Chest', 'Back', 'Shoulders', 'Legs', 'Abs'];

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



  const handleMuscleToggle = useCallback((m: string) => {
    setSelectedMuscles(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }, []);

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
    <MobilePageWrapper 
      title="Workout Cycle"
      subtitle={isEditing ? "Edit Today's Focus" : "Today's Focus"}
      headerRight={isEditing && todayPlan.type && (
        <button 
          onClick={() => setIsEditing(false)} 
          className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-white/5 px-3 py-2 rounded-full border border-white/10"
        >
          Cancel
        </button>
      )}
      contentClassName="flex flex-col gap-4"
    >

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
                    Apply Today&apos;s Plan
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
    </MobilePageWrapper>
  );
}
