import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MobilePanel = 'menu' | 'attendance' | 'diet' | 'progress' | 'workout' | 'settings';

interface AppState {
  // Navigation
  activePanel: MobilePanel;
  setActivePanel: (panel: MobilePanel) => void;
  
  // Engagement Tracking (for PWA and other organic triggers)
  sessionsCount: number;
  incrementSession: () => void;
  attendanceStreak: number;
  incrementStreak: () => void;
  hasSeenPwaPrompt: boolean;
  setHasSeenPwaPrompt: (seen: boolean) => void;
  
  // App initialization state
  isUnlocked: boolean;
  setUnlocked: (unlocked: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activePanel: 'menu',
      setActivePanel: (panel) => set({ activePanel: panel }),
      
      sessionsCount: 0,
      incrementSession: () => set((state) => ({ sessionsCount: state.sessionsCount + 1 })),
      
      attendanceStreak: 0,
      incrementStreak: () => set((state) => ({ attendanceStreak: state.attendanceStreak + 1 })),
      
      hasSeenPwaPrompt: false,
      setHasSeenPwaPrompt: (seen) => set({ hasSeenPwaPrompt: seen }),
      
      isUnlocked: false,
      setUnlocked: (unlocked) => set({ isUnlocked: unlocked }),
    }),
    {
      name: 'myfit-app-storage',
      partialize: (state) => ({ 
        sessionsCount: state.sessionsCount, 
        attendanceStreak: state.attendanceStreak,
        hasSeenPwaPrompt: state.hasSeenPwaPrompt 
      }),
    }
  )
);
