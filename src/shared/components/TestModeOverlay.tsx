// TEST_MODE_ONLY
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSandboxStore } from '@/shared/store/useSandboxStore';
import { APP_TEST_MODE, getTestTodayString } from '@/shared/utils/testMode';
import { Settings2, ChevronDown, RefreshCw, Coffee } from 'lucide-react';
import { useWorkoutStore } from '@/shared/store/useWorkoutStore';

export function TestModeOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  const advanceDays = useSandboxStore(state => state.advanceDays);
  const clearSandbox = useSandboxStore(state => state.clearSandbox);
  const testAccountStatus = useSandboxStore(state => state.testAccountStatus);
  const setAccountStatus = useSandboxStore(state => state.setAccountStatus);
  const resetWeeklyCycle = useWorkoutStore(state => state.resetWeeklyCycle);

  if (!APP_TEST_MODE) return null;

  const currentTestDateStr = getTestTodayString();
  const [year, month, day] = currentTestDateStr.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  
  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDayName = daysMap[localDate.getDay()];

  const handleForceSunday = () => {
    // calculate days to next Sunday or previous Sunday
    const currentDay = localDate.getDay();
    const daysToSunday = currentDay === 0 ? 0 : 7 - currentDay;
    if (daysToSunday > 0) {
      advanceDays(daysToSunday);
    }
  };

  const handleClearSandbox = () => {
    clearSandbox();
    resetWeeklyCycle();
  };

  return (
    <div className="fixed bottom-24 right-4 z-[100] flex flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="p-4 bg-black/90 backdrop-blur-xl border border-red-500/40 rounded-2xl shadow-2xl flex flex-col gap-4 w-56"
          >
            <div className="text-[10px] font-bold text-red-400 tracking-widest uppercase flex items-center justify-between border-b border-white/10 pb-2">
              <span>App Sandbox</span>
              <span className="bg-red-500/20 px-1.5 py-0.5 rounded">Active</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Mock Date:</span>
                <span className="font-mono text-zinc-200">{currentTestDateStr}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Mock Day:</span>
                <span className="font-bold text-white">{currentDayName}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => advanceDays(-1)}
                className="py-2 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-colors"
              >
                -1 Day
              </button>
              <button 
                onClick={() => advanceDays(1)}
                className="py-2 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-colors"
              >
                +1 Day
              </button>
              <button 
                onClick={() => advanceDays(7)}
                className="col-span-2 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-xs hover:bg-cyan-500/20 transition-colors"
              >
                +1 Week
              </button>
            </div>

            <button 
              onClick={handleForceSunday}
              className="w-full py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs flex items-center justify-center gap-1.5 hover:bg-amber-500/20 transition-colors"
            >
              <Coffee className="w-3.5 h-3.5" /> Next Sunday (Rest)
            </button>

            <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Auth Status</div>
              <select
                value={testAccountStatus}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(e) => setAccountStatus(e.target.value as any)}
                className="w-full bg-black border border-white/10 rounded-lg text-xs p-2 text-white outline-none"
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="unrequested">Unrequested</option>
                <option value="rejected">Rejected</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>

            <button 
              onClick={handleClearSandbox}
              className="w-full py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-xs flex items-center justify-center gap-1.5 hover:bg-red-500/20 transition-colors mt-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear Sandbox
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/40 text-red-400 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:bg-red-500/30 transition-colors"
      >
        {isOpen ? <ChevronDown className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
      </button>
    </div>
  );
}
