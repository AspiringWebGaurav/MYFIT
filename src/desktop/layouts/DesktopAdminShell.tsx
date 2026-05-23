"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';
import { adminLogout } from '@/app/actions/adminAuth';
import { OceanicBackground } from '@/shared/components/OceanicBackground';
import { Logo } from '@/shared/components/Logo';
import { LiveDateTimeBar } from '@/shared/components/LiveDateTimeBar';
import { AdminRequestsPanel } from '@/shared/admin/panels/AdminRequestsPanel';
import { AdminHistoryPanel } from '@/shared/admin/panels/AdminHistoryPanel';
import { useRouter } from 'next/navigation';
import { History } from 'lucide-react';

type AdminPanelType = 'dashboard' | 'requests' | 'history';

export function DesktopAdminShell() {
  const [activePanel, setActivePanel] = useState<AdminPanelType>('requests');
  const [isMounted, setIsMounted] = useState(false);

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

  const router = useRouter();

  // Prevent rendering panels until mounted to match SSR
  if (!isMounted) return null;

  const navItems = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'requests', label: 'Pending Requests', icon: Users },
    { id: 'history', label: 'Request History', icon: History },
  ] as const;

  const handleLogout = async () => {
    await adminLogout();
    router.refresh(); // This will trigger the server to re-evaluate the cookie and show login
  };

  return (
    <div className="relative flex h-screen w-full bg-[#020B1A] text-zinc-100 overflow-hidden font-sans">
      <OceanicBackground interactive={false} variant="full" />
      
      {/* Sidebar */}
      <div className="relative z-10 w-[280px] border-r border-cyan-400/10 bg-[#071018cc] p-6 flex flex-col backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-8 w-8 flex items-center justify-center shrink-0 shadow-sm rounded-xl overflow-hidden border border-cyan-500/20">
            <Logo />
          </div>
          <span className="font-semibold tracking-tight text-cyan-50">MYFIT Admin</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = activePanel === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActivePanel(item.id as AdminPanelType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-cyan-950/40 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.1)]' 
                    : 'text-zinc-400 hover:bg-[#10202cb5] hover:text-zinc-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-cyan-400/10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 truncate">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-400/20 shrink-0 bg-cyan-950/50 flex items-center justify-center">
                 <span className="text-cyan-400 text-xs font-bold">ADM</span>
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-zinc-200 truncate">System Admin</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 overflow-hidden bg-transparent">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent pointer-events-none" />
        
        {/* Unified Live Date Time Bar */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="pointer-events-auto drop-shadow-md">
            <LiveDateTimeBar />
          </div>
        </div>

        <div className="h-full w-full px-10 pb-10 pt-28 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full max-w-5xl mx-auto"
            >
              {activePanel === 'requests' && <AdminRequestsPanel />}
              {activePanel === 'history' && <AdminHistoryPanel />}
              {activePanel === 'dashboard' && (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-500 mt-20">
                  <LayoutDashboard className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-lg">Admin Dashboard Area</p>
                  <p className="text-sm">Additional admin widgets can go here.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
