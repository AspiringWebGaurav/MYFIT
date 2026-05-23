import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/shared/store/useAuthStore';
import { useAttendanceStore } from '@/shared/store/useAttendanceStore';
import { useAppStore } from '@/shared/store/useAppStore';

export function useAttendanceFlow() {
  const user = useAuthStore(state => state.user);
  const isAttendedToday = useAttendanceStore(state => state.isAttendedToday);
  const checkAttendanceStatus = useAttendanceStore(state => state.checkAttendanceStatus);
  const markAttendance = useAttendanceStore(state => state.markAttendance);
  const incrementStreak = useAppStore(state => state.incrementStreak);

  const [showPulse, setShowPulse] = useState(false);
  const [interactionState, setInteractionState] = useState<'idle' | 'registering' | 'complete'>('idle');

  useEffect(() => {
    if (user) {
      checkAttendanceStatus(user.uid);
    }
  }, [user, checkAttendanceStatus]);

  const isHoliday = new Date().getDay() === 0;

  const handleMarkAttendance = useCallback(async () => {
    if (user && !isAttendedToday && interactionState === 'idle' && !isHoliday) {
      setInteractionState('registering');
      
      const networkPromise = markAttendance(user.uid);
      const cinematicDelay = new Promise(resolve => setTimeout(resolve, 1200));
      
      await Promise.all([networkPromise, cinematicDelay]);
      
      incrementStreak();
      
      setInteractionState('complete');
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 2000);
    }
  }, [user, isAttendedToday, interactionState, markAttendance, incrementStreak]);

  const isLockedIn = isAttendedToday || interactionState === 'complete';
  const isRegistering = interactionState === 'registering';

  return {
    handleMarkAttendance,
    showPulse,
    isLockedIn,
    isRegistering,
    interactionState,
    isHoliday
  };
}
