import { create } from 'zustand';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';

// 1. Non-Reactive Module-Level Locks & Refs
let popupSessionActive = false;
let authAttemptId = 0;
let focusTimeout: NodeJS.Timeout | null = null;

// 2. Preload Google Provider settings for perceived performance
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

interface AuthState {
  user: User | null;
  authStatus: AuthStatus;
  error: string | null;
  isInitialAuthReady: boolean;
  
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setAuthStatus: (status: AuthStatus) => void;
  clearError: () => void;
  resetAuthSafely: (reason?: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  authStatus: 'idle',
  error: null,
  isInitialAuthReady: false,

  login: async () => {
    // FORCE CLEANUP of any pending focus timeouts when a new login starts
    if (focusTimeout) {
      clearTimeout(focusTimeout);
      focusTimeout = null;
    }

    // Strict Concurrency Lock
    if (popupSessionActive || get().authStatus === 'loading') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Auth blocked: Popup session already active.');
      }
      return;
    }

    // Track the current attempt to prevent stale promises from updating state
    const currentAttempt = ++authAttemptId;
    let localTimeoutRef: NodeJS.Timeout | null = null;

    try {
      // Explicitly lock and update UI state FIRST
      popupSessionActive = true;
      set({ authStatus: 'loading', error: null });

      // Universal 10-second timeout safeguard & synchronous popup trigger
      const authPromise = signInWithPopup(auth, googleProvider);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        localTimeoutRef = setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 10000);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await Promise.race([authPromise, timeoutPromise]) as any;
      
      // Cleanup timeout to prevent memory leaks
      if (localTimeoutRef) clearTimeout(localTimeoutRef);

      // If this attempt is no longer the active one, bail out silently
      if (currentAttempt !== authAttemptId) return;

      if (result.user.email !== 'gauravpatil9262@gmail.com') {
        await signOut(auth);
        set({ authStatus: 'error', error: 'unauthorized', user: null });
        popupSessionActive = false;
        return;
      }
      
      set({ user: result.user, authStatus: 'success', error: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Cleanup timeout
      if (localTimeoutRef) clearTimeout(localTimeoutRef);
      
      // Ignore if a newer attempt has started
      if (currentAttempt !== authAttemptId) return;

      if (process.env.NODE_ENV === 'development') {
        console.warn('Auth Lifecycle Interrupted:', error?.code || error?.message);
      }
      
      const isCancellation = 
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request' ||
        error?.code === 'auth/popup-blocked' ||
        error?.message === 'AUTH_TIMEOUT';
      
      // FULL RESET TO IDLE
      if (isCancellation) {
        set({ authStatus: 'idle', error: null });
      } else {
        set({ authStatus: 'error', error: error?.message || 'Authentication failed' });
      }
    } finally {
      // ALWAYS release lock if this was the active attempt
      if (currentAttempt === authAttemptId) {
        popupSessionActive = false;
      }
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null, authStatus: 'idle', error: null });
  },

  setUser: (user) => {
    if (user && user.email !== 'gauravpatil9262@gmail.com') {
        signOut(auth);
        set({ error: 'unauthorized', user: null, authStatus: 'error', isInitialAuthReady: true });
        return;
    }
    set({ user, isInitialAuthReady: true, authStatus: user ? 'success' : 'idle' });
  },

  setAuthStatus: (status) => set({ authStatus: status }),
  clearError: () => set({ error: null, authStatus: 'idle' }),
  
  resetAuthSafely: (reason = 'manual') => {
    if (get().authStatus === 'loading' || popupSessionActive) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Safely resetting stuck auth state. Reason: ${reason}`);
      }
      // Increment attempt ID to invalidate any pending promises from resolving
      authAttemptId++; 
      popupSessionActive = false;
      set({ authStatus: 'idle', error: null });
    }
  }
}));

// Debounced Window Focus Recovery
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    if (focusTimeout) clearTimeout(focusTimeout);
    
    focusTimeout = setTimeout(() => {
      // Only trigger recovery if the store is actually stuck in loading state
      const state = useAuthStore.getState();
      if (state.authStatus === 'loading') {
        state.resetAuthSafely('window_focus_recovery');
      }
    }, 2500); // 2500ms debounce to allow mobile OAuth redirects to resolve
  });
}
