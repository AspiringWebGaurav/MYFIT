import { create } from 'zustand';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase/config';
import { DietPlanMetadata } from '../hooks/useDietVaultStorage';

interface DietVaultState {
  dietPlan: DietPlanMetadata | null;
  isLoading: boolean;
  error: string | null;
  unsubscribe: Unsubscribe | null;
  
  subscribeToPlan: (userId: string) => void;
  unsubscribeFromPlan: () => void;
}

export const useDietVaultStore = create<DietVaultState>((set, get) => ({
  dietPlan: null,
  isLoading: true,
  error: null,
  unsubscribe: null,

  subscribeToPlan: (userId: string) => {
    // Unsubscribe from any previous listener
    const currentUnsub = get().unsubscribe;
    if (currentUnsub) {
      currentUnsub();
    }

    set({ isLoading: true, error: null });

    const docRef = doc(db, 'dietPlans', userId);
    const unsub = onSnapshot(docRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          set({ dietPlan: snapshot.data() as DietPlanMetadata, isLoading: false });
        } else {
          set({ dietPlan: null, isLoading: false });
        }
      },
      (error) => {
        console.error("Error fetching diet plan:", error);
        set({ error: error.message, isLoading: false, dietPlan: null });
      }
    );

    set({ unsubscribe: unsub });
  },

  unsubscribeFromPlan: () => {
    const unsub = get().unsubscribe;
    if (unsub) {
      unsub();
      set({ unsubscribe: null, dietPlan: null });
    }
  }
}));
