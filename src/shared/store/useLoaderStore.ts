import { create } from 'zustand';

interface LoaderState {
  isLoading: boolean;
  isAppReady: boolean;
  message: string | null;

  startLoading: (message?: string) => void;
  stopLoading: () => void;
  setAppReady: (ready: boolean) => void;
  withLoader: <T>(promise: Promise<T>, message?: string) => Promise<T>;
}

// Internal state tracking for debouncing and minimum display time
let loadStartTime = 0;
let loadingTimeoutId: NodeJS.Timeout | null = null;
let stopTimeoutId: NodeJS.Timeout | null = null;

const DEBOUNCE_MS = 100;
const MIN_DISPLAY_MS = 500;

export const useLoaderStore = create<LoaderState>((set, get) => ({
  isLoading: false,
  isAppReady: false,
  message: null,

  startLoading: (message?: string) => {
    if (stopTimeoutId) {
      clearTimeout(stopTimeoutId);
      stopTimeoutId = null;
    }

    // If already loading, just update the message
    if (get().isLoading) {
      set({ message: message || null });
      return;
    }

    if (loadingTimeoutId) return; // already pending

    loadingTimeoutId = setTimeout(() => {
      loadStartTime = Date.now();
      set({ isLoading: true, message: message || null });
      loadingTimeoutId = null;
    }, DEBOUNCE_MS);
  },

  stopLoading: () => {
    if (loadingTimeoutId) {
      // Finished before debounce hit - never show loader
      clearTimeout(loadingTimeoutId);
      loadingTimeoutId = null;
      set({ isLoading: false, message: null });
      return;
    }

    if (!get().isLoading) return;

    const timeElapsed = Date.now() - loadStartTime;
    const timeRemaining = Math.max(0, MIN_DISPLAY_MS - timeElapsed);

    if (stopTimeoutId) {
      clearTimeout(stopTimeoutId);
    }

    stopTimeoutId = setTimeout(() => {
      set({ isLoading: false, message: null });
      stopTimeoutId = null;
    }, timeRemaining);
  },

  setAppReady: (ready: boolean) => {
    set({ isAppReady: ready });
  },

  withLoader: async (promise, message) => {
    const { startLoading, stopLoading } = get();
    startLoading(message);
    try {
      const result = await promise;
      return result;
    } finally {
      stopLoading();
    }
  }
}));
