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
      || ('standalone' in navigator && (navigator as any).standalone === true);
    
    if (isStandalone) {
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
          disabled={isInstalled || (!deferredPrompt && !isSafari)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
            isInstalled 
              ? 'bg-green-500/10 text-green-400 shadow-[0_0_0_1px_rgba(74,222,128,0.1)] cursor-default'
              : (!deferredPrompt && !isSafari)
                ? 'opacity-0 h-0 p-0 m-0 overflow-hidden absolute pointer-events-none' // Hide if unavailable
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
    <div className="w-full">
      <button
        onClick={isInstalled ? undefined : handleInstallClick}
        disabled={isInstalled || (!deferredPrompt && !isSafari)}
        className={`w-full h-12 rounded-xl flex items-center justify-center gap-2 font-medium tracking-wide transition-all ${
          isInstalled 
            ? 'bg-green-500/10 text-green-400 border border-green-500/20 cursor-default'
            : (!deferredPrompt && !isSafari)
              ? 'opacity-0 h-0 p-0 overflow-hidden absolute pointer-events-none' // Hide if unavailable
              : 'bg-[#10202cb5] text-cyan-400 border border-cyan-400/20 hover:bg-cyan-500/10'
        }`}
      >
        <AnimatePresence mode="wait">
          {showIosInstructions ? (
            <motion.div 
              key="ios"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 text-xs"
            >
              <Info className="h-4 w-4" />
              <span>Tap Share ➔ Add to Home Screen</span>
            </motion.div>
          ) : (
            <motion.div 
              key="default"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2"
            >
              {isInstalled ? <CheckCircle2 className="h-5 w-5" /> : <Download className="h-5 w-5" />}
              <span>{isInstalled ? 'MYFIT Installed' : 'Install MYFIT'}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
