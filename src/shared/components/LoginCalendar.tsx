import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAttendanceStore } from '@/shared/store/useAttendanceStore';
import { useAuthStore } from '@/shared/store/useAuthStore';

interface LoginCalendarProps {
  compact?: boolean;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function LoginCalendar({ compact = false }: LoginCalendarProps) {
  const user = useAuthStore((state) => state.user);
  const attendanceHistory = useAttendanceStore((state) => state.attendanceHistory);
  const fetchAttendanceHistory = useAttendanceStore((state) => state.fetchAttendanceHistory);

  const [currentDate, setCurrentDate] = useState(new Date());
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  useEffect(() => {
    if (user) {
      fetchAttendanceHistory(user.uid, currentYear, currentMonth + 1);
    }
  }, [user, currentYear, currentMonth, fetchAttendanceHistory]);

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const renderDays = () => {
    const days = [];
    const today = new Date();
    
    // Empty slots before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={compact ? "w-8 h-8" : "w-9 h-9 sm:w-10 sm:h-10"} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isAttended = attendanceHistory[dateStr];
      const isToday = today.getDate() === d && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
      
      days.push(
        <motion.div
          key={d}
          whileTap={!compact ? { scale: 0.9 } : undefined}
          className={`${compact ? "w-8 h-8" : "w-9 h-9 sm:w-10 sm:h-10"} rounded-full flex flex-col items-center justify-center text-sm font-medium transition-all duration-300 ${
            isAttended 
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/30' 
              : isToday 
                ? 'bg-white/10 text-white border border-white/20' 
                : 'text-zinc-500 hover:bg-white/5 border border-transparent'
          }`}
        >
          {d}
        </motion.div>
      );
    }
    return days;
  };

  return (
    <div className={`flex flex-col items-center bg-[#0b1620a8] border border-cyan-400/10 ${compact ? 'rounded-2xl p-4 w-full' : 'rounded-[2rem] p-6 w-full max-w-[360px]'} backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.02)]`}>
      <div className={`flex items-center justify-between w-full ${compact ? 'mb-2' : 'mb-6'}`}>
        {!compact && (
          <button onClick={prevMonth} className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        
        <div className={`flex-1 text-center font-medium ${compact ? 'text-base text-white/90' : 'text-xl text-white'} tracking-wide`}>
          {MONTH_NAMES[currentMonth]} {currentYear}
        </div>

        {!compact && (
          <button 
            onClick={nextMonth} 
            disabled={currentYear === new Date().getFullYear() && currentMonth === new Date().getMonth()}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className={`grid grid-cols-7 gap-1 sm:gap-2 w-full text-center ${compact ? 'mb-1' : 'mb-2'}`}>
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      <div className="relative w-full">
        <AnimatePresence mode="wait">
          <motion.div 
            key={`${currentYear}-${currentMonth}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`grid grid-cols-7 ${compact ? 'gap-1' : 'gap-1.5 sm:gap-2'} w-full justify-items-center`}
          >
            {renderDays()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
