// TEST_MODE_ONLY
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AccountStatus = 'approved' | 'pending' | 'unrequested' | 'rejected' | 'revoked';

interface SandboxState {
  testDateStr: string | null; 
  testAttendanceHistory: Record<string, boolean>;
  testAccountStatus: AccountStatus;
  
  advanceDays: (days: number) => void;
  setAccountStatus: (status: AccountStatus) => void;
  markTestAttendance: (dateStr: string) => void;
  clearSandbox: () => void;
}

const getLocalTodayString = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

export const useSandboxStore = create<SandboxState>()(
  persist(
    (set, get) => ({
      testDateStr: null,
      testAttendanceHistory: {},
      testAccountStatus: 'approved',

      advanceDays: (days: number) => {
        set((state) => {
          const baseDateStr = state.testDateStr || getLocalTodayString();
          // We need to parse it as local date, avoiding UTC shift
          const [year, month, day] = baseDateStr.split('-').map(Number);
          const d = new Date(year, month - 1, day);
          d.setDate(d.getDate() + days);
          const offset = d.getTimezoneOffset() * 60000;
          return { testDateStr: new Date(d.getTime() - offset).toISOString().split('T')[0] };
        });
      },

      setAccountStatus: (status) => set({ testAccountStatus: status }),

      markTestAttendance: (dateStr: string) => set((state) => ({
        testAttendanceHistory: { ...state.testAttendanceHistory, [dateStr]: true }
      })),

      clearSandbox: () => set({
        testDateStr: null,
        testAttendanceHistory: {},
        testAccountStatus: 'approved',
      }),
    }),
    {
      name: 'myfit-sandbox',
    }
  )
);
