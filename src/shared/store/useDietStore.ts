import { create } from 'zustand';

interface DietItem {
  meal: string;
  food: string;
}

interface DietDay {
  type: string;
  meals: DietItem[];
}

const dietPlan: Record<number, DietDay> = {
  1: { // Monday
    type: "VEG",
    meals: [
      { meal: "Morning", food: "Black coffee + banana" },
      { meal: "Breakfast", food: "Oats + milk" },
      { meal: "Lunch", food: "Dal + roti/rice + sabji + curd" },
      { meal: "Evening", food: "Tea + oats" },
      { meal: "Dinner", food: "250–300g paneer" }
    ]
  },
  2: { // Tuesday
    type: "NON-VEG",
    meals: [
      { meal: "Morning", food: "Black coffee + banana" },
      { meal: "Breakfast", food: "Oats + 3 eggs" },
      { meal: "Lunch", food: "125g chicken" },
      { meal: "Evening", food: "Oats + 2 eggs + tea" },
      { meal: "Dinner", food: "Remaining chicken" }
    ]
  },
  3: { // Wednesday
    type: "NON-VEG",
    meals: [
      { meal: "Morning", food: "Black coffee + banana" },
      { meal: "Breakfast", food: "Oats + 3 eggs" },
      { meal: "Lunch", food: "125g chicken" },
      { meal: "Evening", food: "Oats + 2 eggs + tea" },
      { meal: "Dinner", food: "Remaining chicken" }
    ]
  },
  4: { // Thursday
    type: "VEG",
    meals: [
      { meal: "Morning", food: "Black coffee + banana" },
      { meal: "Breakfast", food: "Oats + milk" },
      { meal: "Lunch", food: "Dal + roti/rice + sabji + curd" },
      { meal: "Evening", food: "Tea + oats" },
      { meal: "Dinner", food: "250–300g paneer" }
    ]
  },
  5: { // Friday
    type: "NON-VEG",
    meals: [
      { meal: "Morning", food: "Black coffee + banana" },
      { meal: "Breakfast", food: "Oats + 3 eggs" },
      { meal: "Lunch", food: "125g chicken" },
      { meal: "Evening", food: "Oats + 2 eggs + tea" },
      { meal: "Dinner", food: "Remaining chicken" }
    ]
  },
  6: { // Saturday
    type: "NON-VEG",
    meals: [
      { meal: "Morning", food: "Black coffee + banana" },
      { meal: "Breakfast", food: "Oats + 3 eggs" },
      { meal: "Lunch", food: "125g chicken" },
      { meal: "Evening", food: "Oats + 2 eggs + tea" },
      { meal: "Dinner", food: "Remaining chicken" }
    ]
  },
  0: { // Sunday
    type: "RECOVERY",
    meals: [
      { meal: "All Day", food: "Hydration focus & recovery" },
      { meal: "Evening", food: "Shivaji Stadium evening cardio" }
    ]
  }
};

interface DietState {
  currentDay: number;
  getDietForToday: () => DietDay;
}

export const useDietStore = create<DietState>((set, get) => ({
  currentDay: new Date().getDay(),
  getDietForToday: () => {
    const day = get().currentDay;
    return dietPlan[day];
  }
}));
