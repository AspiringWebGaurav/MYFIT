"use client";
import { useScreenSize } from "@/shared/hooks/useScreenSize";
import dynamic from "next/dynamic";
import { GlobalLoader } from "@/shared/components/GlobalLoader";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const DesktopAdminShell = dynamic(() => import("@/desktop/layouts/DesktopAdminShell").then(mod => mod.DesktopAdminShell), { ssr: false, loading: () => <GlobalLoader /> });
const MobileAdminShell = dynamic(() => import("@/mobile/layouts/MobileAdminShell").then(mod => mod.MobileAdminShell), { ssr: false, loading: () => <GlobalLoader /> });

export function AdminAppShell() {
  const { isMobile, initialized } = useScreenSize();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !initialized) {
    return <GlobalLoader />;
  }

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#020B1A]">
      <AnimatePresence>
        <motion.div
          key="admin-app"
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0 pointer-events-auto"
        >
          {isMobile ? <MobileAdminShell /> : <DesktopAdminShell />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
