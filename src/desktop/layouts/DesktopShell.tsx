import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Utensils, CheckCircle, LogOut, Dumbbell } from 'lucide-react';
import { useAuthStore } from '@/shared/store/useAuthStore';
import { DesktopDashboard, DesktopDiet, DesktopAttendance, DesktopWorkout } from '../panels/DesktopPanels';
import { OceanicBackground } from '@/shared/components/OceanicBackground';
import { Logo } from '@/shared/components/Logo';
import { LiveDateTimeBar } from '@/shared/components/LiveDateTimeBar';
import { InstallPwaPrompt } from '@/shared/components/InstallPwaPrompt';
import { TestModeOverlay } from '@/shared/components/TestModeOverlay';

type PanelType = 'dashboard' | 'diet' | 'attendance' | 'workout';

export function DesktopShell() {
  const [activePanel, setActivePanel] = useState<PanelType>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('desktop_active_panel');
      if (saved === 'dashboard' || saved === 'diet' || saved === 'attendance' || saved === 'workout') {
        return saved as PanelType;
      }
    }
    return 'dashboard';
  });

  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    sessionStorage.setItem('desktop_active_panel', activePanel);
  }, [activePanel]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'diet', label: 'Diet Plan', icon: Utensils },
    { id: 'attendance', label: 'Attendance', icon: CheckCircle },
    { id: 'workout', label: 'Workout Cycle', icon: Dumbbell },
  ] as const;

  return (
    <div className="relative flex h-screen w-full bg-[#020B1A] text-zinc-100 overflow-hidden font-sans">
      <OceanicBackground interactive={false} variant="full" />
      
      {/* Sidebar */}
      <div className="relative z-10 w-[280px] border-r border-cyan-400/10 bg-[#071018cc] p-6 flex flex-col backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-8 w-8 flex items-center justify-center shrink-0 shadow-sm rounded-xl overflow-hidden">
            <Logo />
          </div>
          <span className="font-semibold tracking-tight text-zinc-100">MYFIT</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = activePanel === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActivePanel(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-[#10202cb5] text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]' 
                    : 'text-zinc-400 hover:bg-[#10202cb5] hover:text-zinc-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-cyan-400/10 flex flex-col gap-4">
          <InstallPwaPrompt variant="desktop" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 truncate">
              {user?.photoURL && (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-400/10 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="truncate">
                <p className="text-sm font-medium text-zinc-200 truncate">{user?.displayName}</p>
              </div>
            </div>
            <button onClick={logout} className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-[#10202cb5] rounded-md transition-colors">
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
              {activePanel === 'dashboard' && <DesktopDashboard />}
              {activePanel === 'diet' && <DesktopDiet />}
              {activePanel === 'attendance' && <DesktopAttendance />}
              {activePanel === 'workout' && <DesktopWorkout />}
            </motion.div>
          </AnimatePresence>
        </div>
        <TestModeOverlay />
      </div>
    </div>
  );
}
