import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// TEST_MODE_ONLY
import { APP_TEST_MODE, getTestCurrentDay } from '@/shared/utils/testMode';

export type DayConfigType = 'workout' | 'recovery' | 'locked';
export type TrainingType = 'Dual Muscle' | 'Single Muscle' | 'Cardio' | 'Full Body' | 'Recovery' | null;

export interface WorkoutPlan {
  dayConfig: DayConfigType;
  type: TrainingType;
  muscles: string[];
}

interface WorkoutState {
  weeklyPlan: Record<number, WorkoutPlan>;
  setDailyPlan: (day: number, plan: Partial<WorkoutPlan>) => void;
  
  // TEST_MODE_ONLY
  resetWeeklyCycle: () => void;
}

const defaultWeeklyPlan: Record<number, WorkoutPlan> = {
  0: { dayConfig: 'recovery', type: 'Recovery', muscles: [] },
  1: { dayConfig: 'workout', type: null, muscles: [] },
  2: { dayConfig: 'workout', type: null, muscles: [] },
  3: { dayConfig: 'workout', type: null, muscles: [] },
  4: { dayConfig: 'workout', type: null, muscles: [] },
  5: { dayConfig: 'workout', type: null, muscles: [] },
  6: { dayConfig: 'workout', type: null, muscles: [] },
};

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      weeklyPlan: defaultWeeklyPlan,
      setDailyPlan: (day, plan) => set((state) => ({
        weeklyPlan: {
          ...state.weeklyPlan,
          [day]: {
            ...state.weeklyPlan[day],
            ...plan,
          }
        }
      })),

      // TEST_MODE_ONLY
      resetWeeklyCycle: () => set({ weeklyPlan: defaultWeeklyPlan }),
    }),
    {
      name: 'myfit-workout-storage',
      partialize: (state) => ({ weeklyPlan: state.weeklyPlan })
    }
  )
);
