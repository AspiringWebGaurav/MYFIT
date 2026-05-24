"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { useLoaderStore } from '../store/useLoaderStore';
import { GlobalLoader } from './GlobalLoader';

export const GlobalLoaderOverlay: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const isLoading = useLoaderStore((state) => state.isLoading);
  const message = useLoaderStore((state) => state.message);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isLoading && <GlobalLoader fullScreen={true} message={message} />}
    </AnimatePresence>,
    document.body
  );
};
