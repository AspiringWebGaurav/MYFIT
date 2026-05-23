import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { checkAccountStatus } from '@/app/actions/accessRequests';

// 1. Non-Reactive Module-Level Locks & Refs
let popupSessionActive = false;
let authAttemptId = 0;
let focusTimeout: NodeJS.Timeout | null = null;

// 2. Preload Google Provider settings for perceived performance
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export type AuthStatus = 'idle' | 'loading' | 'success' | 'approved' | 'error';

interface AuthState {
  user: User | null;
  authStatus: AuthStatus;
  error: string | null;
  isInitialAuthReady: boolean;
  requestPayload: { email: string; displayName: string; timestamp: number } | null;
  
  
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setAuthStatus: (status: AuthStatus) => void;
  clearError: () => void;
  clearRequestPayload: () => void;
  resetAuthSafely: (reason?: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
  user: null,
  authStatus: 'idle',
  error: null,
  isInitialAuthReady: false,
  requestPayload: null,

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

      const userEmail = result.user.email?.toLowerCase();
      
      const payload = {
        email: result.user.email || '',
        displayName: result.user.displayName || 'Unknown User',
        timestamp: Date.now()
      };

      if (userEmail === 'gauravpatil9262@gmail.com') {
        set({ user: result.user, authStatus: 'success', error: null });
        return;
      }

      let accountStatus = 'unrequested';
      if (userEmail) {
        const res = await checkAccountStatus(userEmail);
        accountStatus = res.status;
      }

      if (accountStatus === 'approved') {
        // Show "Approved" modal for a short time before transitioning
        set({ authStatus: 'approved', error: null });
        
        // We will wait for `useLoaderStore` readiness inside the UI, but 
        // to actually transition, we set the user and success status.
        // We defer this so the UI has time to render the 'approved' state.
        // But the user requested not to use a fixed timeout! 
        // "Show 'Preparing your MYFIT workspace...' only until: auth state resolved, user loaded, app shell ready"
        // If we set `user` immediately, `AppShell` immediately mounts `DesktopShell`.
        // To allow the login screen to render the success state, we can set `user` and `authStatus: 'success'` immediately, 
        // but `AppShell` will unmount `DesktopLogin`. Wait, if we unmount `DesktopLogin`, the modal disappears immediately!
        // To fix this without fixed timeouts: set `user` and let `AppShell` mount `DesktopShell`. 
        // BUT wait, they said "Show Preparing your MYFIT workspace... only until app shell ready".
        // `AppShell` already shows `GlobalLoader` if `!isInitialAuthReady` or `!initialized`.
        // Actually, setting `user` will trigger the crossfade.
        // If they want the modal *inside* the login screen to show "Preparing your MYFIT workspace...", 
        // we can set `user` and the login screen will stay mounted until `AppShell` completes the fade transition (1 second).
        // Let's just set `authStatus: 'approved'` and immediately set `user`.
        
        // Wait, if we set `user: result.user`, Zustand updates `AppShell`, which switches to `DesktopShell`.
        // `DesktopLogin` will play its `exit` animation (1s fade out).
        set({ user: result.user, authStatus: 'approved', error: null });
        return;
      }

      // Unauthorized flows
      await signOut(auth);
      set({ authStatus: 'error', error: accountStatus === 'unrequested' ? 'unauthorized' : accountStatus, user: null, requestPayload: payload });
      popupSessionActive = false;
      return;
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

  setUser: async (user) => {
    if (user) {
      const userEmail = user.email?.toLowerCase();
      
      if (userEmail === 'gauravpatil9262@gmail.com') {
        set({ user, isInitialAuthReady: true, authStatus: 'success' });
        return;
      }

      let accountStatus = 'unrequested';
      if (userEmail) {
        const res = await checkAccountStatus(userEmail);
        accountStatus = res.status;
      }

      if (accountStatus !== 'approved') {
        const payload = {
          email: user.email || '',
          displayName: user.displayName || 'Unknown User',
          timestamp: Date.now()
        };
        await signOut(auth);
        set({ 
          error: accountStatus === 'unrequested' ? 'unauthorized' : accountStatus, 
          user: null, 
          authStatus: 'error', 
          isInitialAuthReady: true,
          requestPayload: payload
        });
        return;
      }
    }
    set({ user, isInitialAuthReady: true, authStatus: user ? 'success' : 'idle' });
  },

  setAuthStatus: (status) => set({ authStatus: status }),
  clearError: () => set({ error: null, authStatus: 'idle', requestPayload: null }),
  clearRequestPayload: () => set({ requestPayload: null }),
  
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
    }),
    {
      name: 'myfit-auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        requestPayload: state.requestPayload
      }),
    }
  )
);

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
