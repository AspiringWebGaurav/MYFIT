import { motion } from 'framer-motion';
import { useAppStore, MobilePanel } from '@/shared/store/useAppStore';
import { CheckCircle2, Utensils, Lock, Settings, Dumbbell, FileText, ImageIcon, PenLine } from 'lucide-react';
import React, { useState } from 'react';

interface MenuCardProps {
  id: MobilePanel;
  title: string;
  icon: React.ElementType;
  delay: number;
  locked?: boolean;
  subtitle?: string;
  onClick?: () => void;
}

const MenuCard = React.memo(function MenuCard({ id, title, icon: Icon, delay, locked, subtitle, onClick }: MenuCardProps) {
  const setActivePanel = useAppStore(state => state.setActivePanel);

  const handleClick = () => {
    if (locked) return;
    if (onClick) onClick();
    setActivePanel(id);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="relative w-full text-left group outline-none"
    >
      <div className={`p-6 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-md overflow-hidden relative ${locked ? 'opacity-50 grayscale' : ''}`}>
        
        {/* Subtle hover/focus glow */}
        {!locked && (
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/0 via-cyan-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        )}

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 ${locked ? 'bg-zinc-900' : 'bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-inner'}`}>
              <Icon className={`w-5 h-5 ${locked ? 'text-zinc-600' : 'text-zinc-300'}`} />
            </div>
            <div>
              <h3 className="text-zinc-100 font-medium text-lg">{title}</h3>
              {subtitle && <p className="text-zinc-500 text-sm mt-0.5">{subtitle}</p>}
            </div>
          </div>
          
          {locked && (
            <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-md">
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
});

import { MobilePageWrapper } from './layout/MobilePageWrapper';

export function MenuHub() {
  const setActivePanel = useAppStore(state => state.setActivePanel);
  const [isRotating, setIsRotating] = useState(false);

  const handleSettingsClick = () => {
    setIsRotating(true);
    setTimeout(() => {
      setActivePanel('settings');
      setIsRotating(false);
    }, 300);
  };

  const settingsButton = (
    <motion.button 
      onClick={handleSettingsClick}
      animate={{ rotate: isRotating ? 90 : 0 }}
      transition={{ duration: 0.3 }}
      whileTap={{ scale: 0.9 }}
      className="p-3 rounded-full bg-white/[0.03] border border-white/5 text-zinc-400 hover:text-white"
    >
      <Settings className="w-5 h-5" />
    </motion.button>
  );

  return (
    <MobilePageWrapper
      title="MYFIT"
      subtitle="Your private fitness space."
      headerRight={settingsButton}
      className="max-w-md mx-auto"
      contentClassName="pt-4 flex flex-col gap-4"
    >
      <MenuCard 
        id="attendance" 
        title="Daily Login" 
        icon={CheckCircle2} 
        delay={0.1} 
      />
      <MenuCard 
        id="diet" 
        title="Diet Plan" 
        icon={Utensils} 
        delay={0.2} 
      />
      <MenuCard 
        id="dietVault" 
        title="Diet Vault" 
        icon={FileText} 
        delay={0.3} 
      />
      <MenuCard 
        id="workout" 
        title="Workout Cycle" 
        icon={Dumbbell} 
        delay={0.4} 
      />
      <MenuCard 
        id="gymGallery" 
        title="Gym Gallery" 
        icon={ImageIcon} 
        delay={0.5} 
      />
      <MenuCard 
        id="trainingJournal" 
        title="Training Journal" 
        subtitle="Capture workout thoughts"
        icon={PenLine} 
        delay={0.6} 
      />
    </MobilePageWrapper>
  );
}
