import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { getGlobalDate } from '@/shared/utils/testMode';

export function LiveDateTimeBar() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setTime(getGlobalDate());

    // Smart Time Synchronization: Precisely align with the exact real-time second boundary
    let intervalId: NodeJS.Timeout;
    
    const syncTimeout = setTimeout(() => {
      setTime(getGlobalDate());
      intervalId = setInterval(() => {
        setTime(getGlobalDate());
      }, 1000);
    }, 1000 - new Date().getMilliseconds()); // We still use real new Date() just for the millisecond offset calculation

    return () => {
      clearTimeout(syncTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // SSR hydration safeguard & layout shift prevention
  if (!mounted || !time) {
    return (
      <div className="h-[42px] w-[260px] rounded-full bg-white/[0.02] border border-white/[0.05] backdrop-blur-md animate-pulse" />
    );
  }

  // Format date and time
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeParts = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).split(' ');
  const timeStr = timeParts[0]; // "09:41:00"
  const ampm = timeParts[1]; // "AM"

  return (
    <div className="flex items-center justify-center w-max h-[42px] px-5 rounded-full bg-white/[0.02] border border-white/[0.06] backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.2)] select-none">
      
      {/* Date Section */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Calendar className="w-[14px] h-[14px] text-cyan-400/60" strokeWidth={2} />
        <span className="text-cyan-50/80 text-[13px] font-medium tracking-wide whitespace-nowrap">
          {dateStr}
        </span>
      </div>

      {/* Optical Symmetrical Divider */}
      <div className="w-[1px] h-3.5 bg-white/10 mx-5" />

      {/* Time Section */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Clock className="w-[14px] h-[14px] text-teal-400/60" strokeWidth={2} />
        <div className="flex items-baseline gap-1 shrink-0">
          {/* tabular-nums prevents horizontal shifting when seconds tick */}
          <span className="text-cyan-50/80 text-[13px] font-medium tracking-wide tabular-nums whitespace-nowrap">
            {timeStr}
          </span>
          <span className="text-cyan-50/40 text-[10px] font-medium tracking-wider uppercase whitespace-nowrap">
            {ampm}
          </span>
        </div>
      </div>
      
    </div>
  );
}
