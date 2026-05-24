import { create } from 'zustand';
import { db } from '../firebase/config';
import { doc, setDoc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuthStore } from './useAuthStore';

// TEST_MODE_ONLY
import { APP_TEST_MODE, getTestTodayString, getTestCurrentDay } from '../utils/testMode';
import { useSandboxStore } from './useSandboxStore';

interface AttendanceState {
  isAttendedToday: boolean;
  loading: boolean;
  lastCheckedAt: number | null;
  attendanceHistory: Record<string, boolean>;
  loadedMonths: string[];
  checkAttendanceStatus: (userId: string, force?: boolean) => Promise<void>;
  markAttendance: (userId: string) => Promise<void>;
  fetchAttendanceHistory: (userId: string, year: number, month: number) => Promise<void>;
}

const getLocalTodayString = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  isAttendedToday: false,
  loading: true,
  lastCheckedAt: null,
  attendanceHistory: {},
  loadedMonths: [],
  checkAttendanceStatus: async (userId: string, force = false) => {
    // 1. Hydration & Auth Check
    const authState = useAuthStore.getState();
    const isValidUser = APP_TEST_MODE 
      ? authState.user?.email === 'sandbox@myfit.test'
      : authState.user?.email === 'gauravpatil9262@gmail.com';

    if (!authState.isInitialAuthReady || !authState.user || !isValidUser) {
      set({ loading: false, isAttendedToday: false });
      return;
    }

    // Smart Reconciliation: Cache TTL of 5 minutes to prevent redundant reads on navigation
    const now = Date.now();
    const lastChecked = get().lastCheckedAt;
    if (!force && lastChecked && (now - lastChecked < 5 * 60 * 1000) && !APP_TEST_MODE) {
      set({ loading: false });
      return;
    }

    // TEST_MODE_ONLY
    if (APP_TEST_MODE) {
      set({ loading: true });
      const today = getTestTodayString();
      const isAttended = !!useSandboxStore.getState().testAttendanceHistory[today];
      set((state) => ({ 
        isAttendedToday: isAttended, 
        loading: false, 
        lastCheckedAt: Date.now(),
        attendanceHistory: { ...state.attendanceHistory, [today]: isAttended }
      }));
      return;
    }

    set({ loading: true });
    try {
      const today = getLocalTodayString();
      const docRef = doc(db, `users/${userId}/attendance/${today}`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        set((state) => ({ 
          isAttendedToday: true, 
          loading: false, 
          lastCheckedAt: Date.now(),
          attendanceHistory: { ...state.attendanceHistory, [today]: true }
        }));
      } else {
        set({ isAttendedToday: false, loading: false, lastCheckedAt: Date.now() });
      }
    } catch (error) {
      console.error("Error checking attendance:", error);
      set({ loading: false });
    }
  },
  markAttendance: async (userId: string) => {
    // 1. Hydration & Auth Check
    const authState = useAuthStore.getState();
    const isValidUser = APP_TEST_MODE 
      ? authState.user?.email === 'sandbox@myfit.test'
      : authState.user?.email === 'gauravpatil9262@gmail.com';

    if (!authState.isInitialAuthReady || !authState.user || !isValidUser) {
      console.error("Unauthorized: Cannot mark attendance before auth hydration or invalid user.");
      return;
    }

    // 2. Sunday Holiday Check (Backend validation)
    const currentDay = APP_TEST_MODE ? getTestCurrentDay() : new Date().getDay();
    if (currentDay === 0) {
      console.error("Attendance disabled: Sunday is a mandated holiday.");
      return;
    }

    // TEST_MODE_ONLY
    if (APP_TEST_MODE) {
      const today = getTestTodayString();
      useSandboxStore.getState().markTestAttendance(today);
      set((state) => ({ 
        isAttendedToday: true, 
        lastCheckedAt: Date.now(),
        attendanceHistory: { ...state.attendanceHistory, [today]: true }
      }));
      return;
    }

    // Optimistic update
    const today = getLocalTodayString();
    set((state) => ({ 
      isAttendedToday: true, 
      lastCheckedAt: Date.now(),
      attendanceHistory: { ...state.attendanceHistory, [today]: true }
    }));
    try {
      const docRef = doc(db, `users/${userId}/attendance/${today}`);
      await setDoc(docRef, {
        date: today,
        timestamp: Timestamp.now(),
        completed: true
      });
    } catch (error) {
      console.error("Error marking attendance:", error);
      // Revert optimistic update on failure
      set((state) => {
        const newHistory = { ...state.attendanceHistory };
        delete newHistory[today];
        return { isAttendedToday: false, attendanceHistory: newHistory };
      });
    }
  },
  fetchAttendanceHistory: async (userId: string, year: number, month: number) => {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const { loadedMonths, attendanceHistory } = get();
    
    if (loadedMonths.includes(monthStr) && !APP_TEST_MODE) {
      return; 
    }

    // TEST_MODE_ONLY
    if (APP_TEST_MODE) {
      const sandboxHistory = useSandboxStore.getState().testAttendanceHistory;
      set({ 
        attendanceHistory: { ...attendanceHistory, ...sandboxHistory },
        loadedMonths: [...loadedMonths, monthStr]
      });
      return;
    }

    try {
      const attendanceRef = collection(db, `users/${userId}/attendance`);
      
      const startStr = `${monthStr}-00`;
      const endStr = `${monthStr}-31`;
      
      const q = query(
        attendanceRef,
        where('date', '>=', startStr),
        where('date', '<=', endStr)
      );

      const snapshot = await getDocs(q);
      const newHistory = { ...attendanceHistory };
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.date && data.completed) {
          newHistory[data.date] = true;
        }
      });

      set({ 
        attendanceHistory: newHistory,
        loadedMonths: [...loadedMonths, monthStr]
      });
      
    } catch (error) {
      console.error("Error fetching attendance history:", error);
    }
  }
}));
