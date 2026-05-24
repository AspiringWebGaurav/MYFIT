import { useState, useEffect } from 'react';
import { Download, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Extend Window interface for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface InstallPwaPromptProps {
  variant?: 'mobile' | 'desktop';
}

export function InstallPwaPrompt({ variant = 'mobile' }: InstallPwaPromptProps) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    // Check if currently running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      || ('standalone' in navigator && (navigator as any).standalone === true);
    
    if (isStandalone) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInstalled(true);
      return;
    }

    // Listen for the native install prompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Check if iOS Safari (where beforeinstallprompt isn't supported)
      const ua = window.navigator.userAgent;
      const isIos = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
      const webkit = !!ua.match(/WebKit/i);
      const isSafari = isIos && webkit && !ua.match(/CriOS/i);
      
      if (isSafari) {
        setShowIosInstructions(true);
        setTimeout(() => setShowIosInstructions(false), 5000); // Hide after 5 seconds
      } else {
        alert("To install the app, look for the install icon in your browser's address bar or menu.");
      }
    }
  };

  // If we don't have a prompt, aren't on iOS Safari, and aren't installed, 
  // there's no actionable state to show yet (e.g. desktop non-Chrome browser without PWA support)
  // However, we want to at least show it's "Installed" if it is.
  const ua = typeof window !== 'undefined' ? window.navigator.userAgent : '';
  const isIos = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
  const webkit = !!ua.match(/WebKit/i);
  const isSafari = isIos && webkit && !ua.match(/CriOS/i);
  
  if (!isInstalled && !deferredPrompt && !isSafari) {
    // Only return null if we explicitly know it's not installable on this device/browser
    // Wait, on desktop sometimes it takes a second for the event to fire.
    // We can render a disabled state or nothing. For a seamless UX, returning null prevents flash.
    // return null; 
    // Actually, let's keep it mounted but visually disabled, or just return null to hide it completely.
    // Let's render it but indicate it's not available, or just hide it. The requirement says "dynamically adapts".
    // I'll return null to keep the UI clean if installation is impossible.
    // return null;
  }

  if (variant === 'desktop') {
    return (
      <div className="w-full">
        <button
          onClick={isInstalled ? undefined : handleInstallClick}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
            isInstalled 
              ? 'bg-green-500/10 text-green-400 shadow-[0_0_0_1px_rgba(74,222,128,0.1)] cursor-default'
              : 'bg-[#10202cb5] text-zinc-100 hover:bg-cyan-500/10 hover:text-cyan-400 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]'
          }`}
        >
          {isInstalled ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          {isInstalled ? 'MYFIT Installed' : 'Install App'}
        </button>
      </div>
    );
  }

  // Mobile Variant
  return (
    <div className="w-full transition-all duration-300">
      <button
        onClick={isInstalled ? undefined : handleInstallClick}
        disabled={isInstalled}
        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
          isInstalled 
            ? 'bg-white/[0.02] border border-white/[0.05] cursor-default'
            : 'bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] active:scale-[0.98]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isInstalled ? 'bg-green-500/10 text-green-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
            {isInstalled ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          </div>
          <span className={`text-sm font-medium ${isInstalled ? 'text-zinc-300' : 'text-zinc-100'}`}>
            {isInstalled ? 'MYFIT Installed' : 'Install App'}
          </span>
        </div>
        {!isInstalled && (
          <span className="text-xs text-zinc-500 font-medium tracking-wide">
            {isSafari ? 'Add to Home' : 'Get App'}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showIosInstructions && !isInstalled && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <Info className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">iOS Install</span>
              </div>
              <span className="text-xs text-cyan-100/70 leading-relaxed">
                Tap the <strong className="text-cyan-100">Share</strong> icon at the bottom of your screen, then select <strong className="text-cyan-100">Add to Home Screen</strong>.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
