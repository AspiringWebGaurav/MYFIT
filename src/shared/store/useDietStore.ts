import { create } from 'zustand';

// TEST_MODE_ONLY
import { APP_TEST_MODE, getTestCurrentDay } from '../utils/testMode';
import { useSandboxStore } from './useSandboxStore';

export interface DietItem {
  meal: string;
  food: string;
}

export interface DietDay {
  type: string;
  meals: DietItem[];
}

export const vegMeals: DietItem[] = [
  { meal: "Morning", food: "Black coffee + banana" },
  { meal: "Breakfast", food: "Oats + milk" },
  { meal: "Lunch", food: "Dal + roti/rice + sabji + curd" },
  { meal: "Evening", food: "Tea + oats" },
  { meal: "Dinner", food: "250–300g paneer" }
];

export const nonVegMeals: DietItem[] = [
  { meal: "Morning", food: "Black coffee + banana" },
  { meal: "Breakfast", food: "Oats + 3 eggs" },
  { meal: "Lunch", food: "125g chicken" },
  { meal: "Evening", food: "Oats + 2 eggs + tea" },
  { meal: "Dinner", food: "Remaining chicken" }
];

export const recoveryMeals: DietItem[] = [
  { meal: "All Day", food: "Hydration focus & recovery" },
  { meal: "Evening", food: "Shivaji Stadium evening cardio" }
];

export const protocolTypeMap: Record<number, "VEG" | "NON-VEG" | "RECOVERY"> = {
  1: "VEG",
  2: "NON-VEG",
  3: "NON-VEG",
  4: "VEG",
  5: "NON-VEG",
  6: "NON-VEG",
  0: "RECOVERY"
};

type DietPreference = 'protocol' | 'VEG' | 'NON-VEG';

interface DietState {
  currentDay: number;
  dietPreference: DietPreference;
  setDietPreference: (pref: DietPreference) => void;
  getDietForToday: () => DietDay;
}

export const useDietStore = create<DietState>((set, get) => ({
  currentDay: new Date().getDay(),
  dietPreference: 'protocol',
  setDietPreference: (pref) => set({ dietPreference: pref }),
  getDietForToday: () => {
    const day = APP_TEST_MODE ? getTestCurrentDay() : get().currentDay;
    const protocolType = protocolTypeMap[day];
    
    if (protocolType === "RECOVERY") {
      return { type: "RECOVERY", meals: recoveryMeals };
    }

    const activeType = get().dietPreference === 'protocol' 
      ? protocolType 
      : get().dietPreference;

    return {
      type: activeType,
      meals: activeType === "VEG" ? vegMeals : nonVegMeals
    };
  }
}));

export const useTodayDiet = () => {
  const dietPreference = useDietStore(state => state.dietPreference);
  const setDietPreference = useDietStore(state => state.setDietPreference);
  
  // TEST_MODE_ONLY forces re-render when global sandbox date changes
  const testDateStr = useSandboxStore(state => APP_TEST_MODE ? state.testDateStr : null);
  const currentDay = useDietStore(state => APP_TEST_MODE ? getTestCurrentDay() : state.currentDay);
  
  const protocolType = protocolTypeMap[currentDay];
  
  const isRecovery = protocolType === "RECOVERY";
  const activeType = isRecovery 
    ? "RECOVERY" 
    : (dietPreference === 'protocol' ? protocolType : dietPreference);

  const activeMeals = isRecovery 
    ? recoveryMeals 
    : (activeType === "VEG" ? vegMeals : nonVegMeals);

  return {
    diet: { type: activeType, meals: activeMeals },
    isRecovery,
    activeType,
    protocolType,
    dietPreference,
    setDietPreference
  };
};
