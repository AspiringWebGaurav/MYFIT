import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // 0 for infinite (default for loading)
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'> & { id?: string }) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = toast.id || Math.random().toString(36).substring(2, 9);
    set((state) => {
      // Avoid exact duplicates (same message & type)
      if (state.toasts.some((t) => t.message === toast.message && t.type === toast.type)) {
        return state;
      }
      return { toasts: [...state.toasts, { ...toast, id }] };
    });
    return id;
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  updateToast: (id, updates) =>
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  clearToasts: () => set({ toasts: [] }),
}));

// Helper utility for easy access without hooks
export const toast = {
  success: (message: string, duration = 3000) => useToastStore.getState().addToast({ type: 'success', message, duration }),
  error: (message: string, duration = 4000) => useToastStore.getState().addToast({ type: 'error', message, duration }),
  warning: (message: string, duration = 3000) => useToastStore.getState().addToast({ type: 'warning', message, duration }),
  info: (message: string, duration = 3000) => useToastStore.getState().addToast({ type: 'info', message, duration }),
  loading: (message: string) => useToastStore.getState().addToast({ type: 'loading', message, duration: 0 }),
  dismiss: (id: string) => useToastStore.getState().removeToast(id),
  update: (id: string, updates: Partial<Toast>) => useToastStore.getState().updateToast(id, updates),
};
