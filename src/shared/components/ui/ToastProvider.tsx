"use client";
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore, Toast } from '../../store/useToastStore';
import { CheckCircle2, AlertCircle, Info, Loader2, XCircle } from 'lucide-react';

const ToastIcon = ({ type }: { type: Toast['type'] }) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-red-400" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    case 'info':
      return <Info className="w-5 h-5 text-blue-400" />;
    case 'loading':
      return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
  }
};

const ToastItem = ({ toast }: { toast: Toast }) => {
  const removeToast = useToastStore((state) => state.removeToast);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        removeToast(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, removeToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={(e, { offset, velocity }) => {
        if (offset.x > 100 || offset.x < -100 || velocity.x > 500 || velocity.x < -500) {
          removeToast(toast.id);
        }
      }}
      className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/20 text-white w-auto max-w-[90vw] self-center"
      style={{ touchAction: 'none' }} // Ensure smooth swiping
    >
      <ToastIcon type={toast.type} />
      <span className="font-medium text-sm tracking-wide mr-2 drop-shadow-md">
        {toast.message}
      </span>
    </motion.div>
  );
};

export function ToastProvider() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="fixed bottom-32 left-0 right-0 z-[9999] pointer-events-none p-6 flex flex-col gap-2 items-center justify-end">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
