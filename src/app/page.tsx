"use client";
import { useScreenSize } from "@/shared/hooks/useScreenSize";
import { useAuthStore } from "@/shared/store/useAuthStore";
import dynamic from "next/dynamic";
import { GlobalLoader } from "@/shared/components/GlobalLoader";
import { useLoaderStore } from "@/shared/store/useLoaderStore";
import { useAttendanceStore } from "@/shared/store/useAttendanceStore";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const DesktopShell = dynamic(() => import("@/desktop/layouts/DesktopShell").then(mod => mod.DesktopShell), { ssr: false, loading: () => <GlobalLoader /> });
const MobileShell = dynamic(() => import("@/mobile/layouts/MobileShell").then(mod => mod.MobileShell), { ssr: false, loading: () => <GlobalLoader /> });
const DesktopLogin = dynamic(() => import("@/desktop/panels/DesktopLogin").then(mod => mod.DesktopLogin), { ssr: false, loading: () => <GlobalLoader /> });
const MobileLogin = dynamic(() => import("@/mobile/panels/MobileLogin").then(mod => mod.MobileLogin), { ssr: false, loading: () => <GlobalLoader /> });

export default function AppShell() {
  const { isMobile, initialized } = useScreenSize();
  const user = useAuthStore((state) => state.user);
  const isInitialAuthReady = useAuthStore((state) => state.isInitialAuthReady);
  const checkAttendanceStatus = useAttendanceStore((state) => state.checkAttendanceStatus);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    
    // Globally sync attendance status upon authentication
    if (user && isInitialAuthReady) {
      checkAttendanceStatus(user.uid);
    }
    
    // Silent idle prefetching of the core shell chunk
    if (!user && initialized) {
      const prefetchShell = () => {
        if (isMobile) {
          import("@/mobile/layouts/MobileShell");
        } else {
          import("@/desktop/layouts/DesktopShell");
        }
      };
      
      if (typeof window !== "undefined" && 'requestIdleCallback' in window) {
        window.requestIdleCallback(prefetchShell, { timeout: 3000 });
      } else {
        setTimeout(prefetchShell, 2000);
      }
    }
  }, [user, initialized, isMobile]);

  useEffect(() => {
    if (mounted && initialized && isInitialAuthReady) {
      useLoaderStore.getState().setAppReady(true);
    }
  }, [mounted, initialized, isInitialAuthReady]);

  if (!mounted || !initialized || !isInitialAuthReady) {
    return <GlobalLoader />;
  }

  // Crossfade transition between Login and App Shell for iOS/OS-like unlock feel
  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#020B1A]">
      <AnimatePresence>
        {!user ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ 
              opacity: 0, 
              filter: "blur(20px)",
              scale: 1.05,
              transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
            }}
            className="absolute inset-0 z-50 pointer-events-auto"
          >
            {isMobile ? <MobileLogin /> : <DesktopLogin />}
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="absolute inset-0 z-0 pointer-events-auto"
          >
            {isMobile ? <MobileShell /> : <DesktopShell />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
