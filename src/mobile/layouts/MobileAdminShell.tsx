import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OceanicBackground } from '@/shared/components/OceanicBackground';
import { LiveDateTimeBar } from '@/shared/components/LiveDateTimeBar';
import { AdminRequestsPanel } from '@/shared/admin/panels/AdminRequestsPanel';
import { AdminHistoryPanel } from '@/shared/admin/panels/AdminHistoryPanel';
import { LayoutDashboard, Users, History, LogOut } from 'lucide-react';
import { adminLogout } from '@/app/actions/adminAuth';
import { useRouter } from 'next/navigation';

type AdminPanelType = 'dashboard' | 'requests' | 'history';

export function MobileAdminShell() {
  const [activePanel, setActivePanel] = useState<AdminPanelType>('requests');
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    const saved = sessionStorage.getItem('admin_active_panel');
    if (saved === 'dashboard' || saved === 'requests' || saved === 'history') {
      setActivePanel(saved as AdminPanelType);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      sessionStorage.setItem('admin_active_panel', activePanel);
    }
  }, [activePanel, isMounted]);

  const handleLogout = async () => {
    await adminLogout();
    router.refresh();
  };

  if (!isMounted) return null;

  return (
    <div className="relative flex flex-col h-[100dvh] w-full bg-[#020B1A] text-zinc-100 overflow-hidden font-sans">
      <OceanicBackground interactive={false} variant="full" />
      
      {/* Top Header */}
      <div className="absolute top-[env(safe-area-inset-top,24px)] w-full px-6 flex justify-between items-center z-50 pointer-events-none mt-4 sm:mt-6">
        <div className="pointer-events-auto drop-shadow-lg scale-[0.85] sm:scale-95 origin-left">
          <LiveDateTimeBar />
        </div>
        <button 
          onClick={handleLogout} 
          className="pointer-events-auto p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full hover:bg-red-500/20 transition-all backdrop-blur-md"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden pt-28 pb-24 px-4 hide-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full min-h-full"
          >
            {activePanel === 'requests' && <AdminRequestsPanel />}
            {activePanel === 'history' && <AdminHistoryPanel />}
            {activePanel === 'dashboard' && (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500 mt-20">
                <LayoutDashboard className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg text-center">Admin Dashboard Area</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation Pill (GlassNavPill style) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full px-6 max-w-[400px]">
        <div className="pointer-events-auto w-full h-[68px] bg-[#0A1624]/60 backdrop-blur-2xl border border-cyan-400/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-around px-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent opacity-50" />
          
          <button
            onClick={() => setActivePanel('dashboard')}
            className={`relative flex flex-col items-center justify-center w-16 h-full transition-colors ${activePanel === 'dashboard' ? 'text-cyan-400' : 'text-zinc-500'}`}
          >
            <LayoutDashboard className="w-6 h-6 mb-1" />
            {activePanel === 'dashboard' && (
              <motion.div layoutId="adminNavIndicator" className="absolute -top-1 w-8 h-1 bg-cyan-400 rounded-b-md shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            )}
          </button>
          
          <button
            onClick={() => setActivePanel('requests')}
            className={`relative flex flex-col items-center justify-center w-16 h-full transition-colors ${activePanel === 'requests' ? 'text-cyan-400' : 'text-zinc-500'}`}
          >
            <Users className="w-6 h-6 mb-1" />
            {activePanel === 'requests' && (
              <motion.div layoutId="adminNavIndicator" className="absolute -top-1 w-8 h-1 bg-cyan-400 rounded-b-md shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            )}
          </button>
          
          <button
            onClick={() => setActivePanel('history')}
            className={`relative flex flex-col items-center justify-center w-16 h-full transition-colors ${activePanel === 'history' ? 'text-cyan-400' : 'text-zinc-500'}`}
          >
            <History className="w-6 h-6 mb-1" />
            {activePanel === 'history' && (
              <motion.div layoutId="adminNavIndicator" className="absolute -top-1 w-8 h-1 bg-cyan-400 rounded-b-md shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
