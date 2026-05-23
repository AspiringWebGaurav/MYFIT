import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/shared/store/useAuthStore';
import { submitAccessRequest } from '@/app/actions/accessRequests';
import { OceanicBackground } from '@/shared/components/OceanicBackground';
import { LiveDateTimeBar } from '@/shared/components/LiveDateTimeBar';
import { Logo } from '@/shared/components/Logo';
import { Dumbbell, Target, TrendingUp, Zap, X } from 'lucide-react';

const words = ["Track.", "Build.", "Transform.", "Stay Consistent."];

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export function MobileLogin() {
  const login = useAuthStore(state => state.login);
  const error = useAuthStore(state => state.error);
  const logout = useAuthStore(state => state.logout);
  const clearError = useAuthStore(state => state.clearError);
  const authStatus = useAuthStore(state => state.authStatus);
  const requestPayload = useAuthStore(state => state.requestPayload);
  const clearRequestPayload = useAuthStore(state => state.clearRequestPayload);
  
  const [mounted, setMounted] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'success' | 'duplicate'>('idle');
  const [statusMessage, setStatusMessage] = useState("");


  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  // Smooth, premium spring physics for touch/pointer
  const springConfig = { damping: 40, stiffness: 100, mass: 0.8 };
  const smoothX = useSpring(pointerX, springConfig);
  const smoothY = useSpring(pointerY, springConfig);

  // Parallax mappings (lightweight transforms)
  const bgX = useTransform(smoothX, [-0.5, 0.5], [15, -15]);
  const bgY = useTransform(smoothY, [-0.5, 0.5], [15, -15]);
  const waveX = useTransform(smoothX, [-0.5, 0.5], [20, -20]);
  const waveY = useTransform(smoothY, [-0.5, 0.5], [10, -10]);
  const contentX = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);
  const contentY = useTransform(smoothY, [-0.5, 0.5], [-8, 8]);
  const heroX = useTransform(smoothX, [-0.5, 0.5], [-15, 15]); // Extra depth for hero
  const heroY = useTransform(smoothY, [-0.5, 0.5], [-15, 15]);
  
  // Touch Ripple/Glow effect (ambient glow reaction to finger touch)
  const glowOpacity = useTransform(
    useSpring(useTransform(pointerX, (v) => Number(Math.abs(v) > 0.01)), { damping: 20, stiffness: 100 }), 
    [0, 1], [0, 0.15]
  );
  const glowX = useTransform(smoothX, [-0.5, 0.5], ['0%', '100%']);
  const glowY = useTransform(smoothY, [-0.5, 0.5], ['0%', '100%']);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Word carousel setup
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handlePointerMove = (e: React.PointerEvent) => {
    // Avoid layout thrashing by using window dimensions
    pointerX.set(e.clientX / window.innerWidth - 0.5);
    pointerY.set(e.clientY / window.innerHeight - 0.5);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const handleSwitchAccount = async () => {
    await logout();
    clearRequestPayload();
    // Using a brief timeout to let React clean up state before reopening the popup
    setTimeout(() => {
      login();
    }, 250);
  };

  const handleRequestAccess = async () => {
    if (!requestPayload) return;
    setIsRequesting(true);
    const result = await submitAccessRequest(requestPayload);
    setIsRequesting(false);
    
    if (result.success) {
      setRequestStatus('success');
      setStatusMessage("✓ Request Submitted");
    } else if (result.error.includes("already submitted") || result.rateLimited) {
      setRequestStatus('duplicate');
      setStatusMessage(result.error);
    }
    
    setTimeout(() => {
      setRequestStatus('idle');
      if (result.success) {
         clearRequestPayload();
         clearError();
      }
    }, 4000);
  };


  // Apple-level premium easing curve
  const cinematicEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 }
    }
  };

  const fadeUpVariant = {
    hidden: { opacity: 0, y: 16 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 1.2, ease: cinematicEase }
    }
  };

  const isAuthLoading = authStatus === 'loading' || authStatus === 'success';

  return (
    <div 
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#020B1A] relative overflow-hidden selection:bg-cyan-500/30 touch-none"
    >
      {/* Interactive Touch Glow */}
      <motion.div 
        className="absolute w-[80vw] h-[80vw] max-w-[400px] max-h-[400px] rounded-full pointer-events-none mix-blend-screen z-0 will-change-transform"
        style={{ 
          background: 'radial-gradient(circle, rgba(34,211,238,1) 0%, rgba(34,211,238,0) 70%)',
          left: glowX,
          top: glowY,
          opacity: glowOpacity,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(60px)'
        }}
      />

      {/* Immersive Animated Background System */}
      <OceanicBackground isAuthLoading={isAuthLoading} interactive={true} variant="full" />
      
      {/* Live Date Time Bar (Top Centered) */}
      <div className="absolute top-[env(safe-area-inset-top,24px)] left-1/2 -translate-x-1/2 z-20 pointer-events-none mt-4 sm:mt-6">
        <div className="pointer-events-auto scale-[0.85] sm:scale-95 origin-top drop-shadow-lg">
          <LiveDateTimeBar />
        </div>
      </div>

      {/* Login Content Flow */}
      <motion.div
        style={{ x: contentX, y: contentY }}
        initial="hidden"
        animate="show"
        variants={staggerContainer}
        className="z-10 flex w-full h-[100dvh] flex-col items-center px-8 pt-[12vh] pb-[6vh]"
      >
        {/* Top Section - Enhanced Cinematic Hero */}
        <motion.div 
          style={{ x: heroX, y: heroY }} 
          className="flex flex-col items-center w-full shrink-0 relative"
        >
          {/* Hero localized atmosphere */}
          <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
            <motion.div 
              animate={{ opacity: [0.1, 0.25, 0.1], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-[200px] h-[200px] bg-cyan-400/20 rounded-full blur-[60px]"
            />
            {/* Soft light streak */}
            <motion.div 
              animate={{ opacity: [0, 0.15, 0], x: [-50, 50] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-[300px] h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent blur-[2px] rotate-[-15deg]"
            />
          </div>

          {/* Logo with gentle floating/breathing & rotational drift */}
          <motion.div 
            variants={fadeUpVariant}
            animate={{ y: [0, -6, 0], rotateZ: [-1, 1, -1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="h-[84px] w-[84px] flex items-center justify-center mb-10 relative z-10 rounded-[2rem] shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden"
          >
             {/* Deep aura pulse */}
             <motion.div 
               animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.05, 1] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -inset-2 bg-black rounded-full blur-xl z-[-1]"
             />
             <Logo className="w-full h-full relative z-10" />
          </motion.div>
          
          <motion.h1 
            variants={fadeUpVariant}
            className="relative z-10 text-[46px] font-bold tracking-tight text-white mb-4 text-center leading-none"
          >
            MYFIT
          </motion.h1>
          
          <motion.div variants={fadeUpVariant} className="relative z-10 mb-14 flex flex-col items-center min-h-[80px]">
            <p className="text-[17px] text-cyan-50/70 text-center font-light mb-1">
              Your personal space to
            </p>
            {/* Premium Typewriter / Word Cycle */}
            <div className="relative w-full flex justify-center h-[36px] items-center">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={wordIndex}
                  initial={{ opacity: 0, filter: 'blur(4px)', x: -4 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
                  exit={{ opacity: 0, filter: 'blur(8px)', y: -10 }}
                  transition={{ duration: 0.6, ease: cinematicEase }}
                  className="absolute flex items-center justify-center text-[26px] font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-teal-100 tracking-tight leading-none drop-shadow-sm"
                >
                  {words[wordIndex]}
                  {/* Soft Breathing Cursor */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.8, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    className="w-[2px] h-[26px] bg-cyan-300/80 ml-[4px] rounded-full shadow-[0_0_8px_rgba(103,232,249,0.5)]"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div variants={fadeUpVariant} className="w-full max-w-[320px] relative group mt-2 z-20">
            {/* Soft Premium Glow effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400/30 via-teal-400/30 to-sky-400/30 rounded-[2rem] blur-xl opacity-40 group-hover:opacity-70 group-active:opacity-90 transition-opacity duration-700 ease-out" />
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-300 via-teal-300 to-sky-300 rounded-[2rem] blur-md opacity-20" />
            
            <motion.div 
              whileTap={!isAuthLoading ? { scale: 0.98 } : {}}
              className="relative"
            >
              <Button 
                onClick={login}
                disabled={isAuthLoading}
                className="relative w-full bg-white text-slate-800 hover:bg-zinc-100 h-[60px] rounded-[2rem] text-[17px] font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.12),0_2px_8px_rgba(34,211,238,0.2)] transition-colors duration-300 ease-out overflow-hidden border border-white/60 group/btn"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 to-teal-400/5 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 ease-out" />
                
                {/* Premium Shimmer Loader */}
                <AnimatePresence>
                  {isAuthLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-0 overflow-hidden rounded-[2rem] bg-white/80"
                    >
                      <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent skew-x-12"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative z-10 flex items-center justify-center gap-3">
                  <motion.div
                     animate={isAuthLoading ? { opacity: 0.5, scale: 0.95 } : { opacity: 1, scale: 1 }}
                     transition={{ duration: 0.3 }}
                  >
                    <GoogleIcon />
                  </motion.div>
                  <motion.span 
                    animate={{ opacity: isAuthLoading ? 0.6 : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isAuthLoading ? 'Authenticating...' : 'Continue with Google'}
                  </motion.span>
                </div>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Lower Middle: Feature Icons */}
        <motion.div 
          variants={fadeUpVariant}
          className="flex-1 flex flex-col items-center justify-center w-full min-h-[140px] z-10"
        >
          <div className="flex items-center justify-center w-full max-w-[340px] px-2">
            {[
              { icon: Dumbbell, title: "Track\nWorkouts" },
              { icon: Target, title: "Build\nConsistency" },
              { icon: TrendingUp, title: "See\nProgress" }
            ].map((feature, idx) => (
              <React.Fragment key={idx}>
                <motion.div 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center flex-1 text-center group cursor-pointer"
                >
                  <motion.div 
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.2 }}
                    className="mb-4 relative"
                  >
                     <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-15 rounded-full group-hover:opacity-30 transition-opacity duration-500" />
                     <feature.icon className="w-7 h-7 text-cyan-300/90 relative z-10 group-hover:text-cyan-200 transition-colors duration-500" strokeWidth={1.25} />
                  </motion.div>
                  <span className="text-[11px] text-cyan-50/70 group-hover:text-cyan-50/90 font-medium tracking-wide leading-[1.3] transition-colors duration-500 whitespace-pre-line">
                    {feature.title}
                  </span>
                </motion.div>
                {idx < 2 && (
                  <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
        
        {/* Bottom: Footer Tagline */}
        <motion.div 
          variants={fadeUpVariant}
          className="flex items-center justify-center gap-2.5 opacity-80 shrink-0 pb-safe z-10"
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Zap className="w-[14px] h-[14px] text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]" fill="currentColor" strokeWidth={0} />
          </motion.div>
          <p className="text-[12px] text-cyan-400/90 font-semibold tracking-[0.25em] uppercase drop-shadow-[0_0_6px_rgba(34,211,238,0.3)]">
            Stay Locked In
          </p>
        </motion.div>
      </motion.div>

      {/* Unauthorized Bottom Sheet Popup */}
      <AnimatePresence>
        {error === 'unauthorized' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => clearError()}
            className="fixed inset-0 z-50 flex flex-col justify-end p-4 pb-8 sm:p-6 bg-[#020B1A]/90 cursor-pointer"
          >
            <motion.div
              initial={{ y: '100%', scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: '100%', scale: 0.95 }}
              transition={{ duration: 0.5, ease: cinematicEase }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full bg-[#041222]/95 border border-cyan-500/30 p-6 rounded-[2rem] shadow-[0_-8px_40px_rgba(6,182,212,0.2)] overflow-hidden cursor-default"
            >
              <button
                onClick={() => clearError()}
                className="absolute top-4 right-4 p-2 text-cyan-500/50 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-full transition-all duration-300 z-20 group"
              >
                <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <X className="w-5 h-5 relative z-10" strokeWidth={1.5} />
              </button>

              {/* Subtle Top Cinematic Edge Glow */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-80" />
              
              {/* Internal ambient glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-teal-500/5 rounded-[2rem] blur-xl z-0 pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Animated Mobile Icon */}
                <motion.div 
                  animate={{ 
                    boxShadow: ["0 0 0px rgba(34,211,238,0)", "0 0 20px rgba(34,211,238,0.3)", "0 0 0px rgba(34,211,238,0)"] 
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-full bg-cyan-950/50 border border-cyan-400/40 flex items-center justify-center mb-4 shrink-0"
                >
                  <span className="text-cyan-300 text-[22px]">🔒</span>
                </motion.div>
                
                <h3 className="text-white font-medium text-[18px] leading-snug mb-2 drop-shadow-sm">
                  Ohoo 👋<br/>
                  Looks like this MYFIT space is private.
                </h3>
                
                <p className="text-cyan-50/70 text-[14px] font-light leading-relaxed mb-4">
                  This app currently supports only approved personal accounts.
                </p>
                
                <p className="text-cyan-100/50 text-[13px] font-light leading-snug mb-6 max-w-[280px]">
                  If you think this is a mistake, try another Google account or request access.
                </p>
                
                {/* Mobile Touch-Optimized Actions */}
                <div className="flex flex-col w-full gap-3">
                  <motion.button
                    onClick={handleRequestAccess}
                    disabled={isRequesting}
                    whileTap={!isRequesting ? { scale: 0.96 } : {}}
                    className="w-full bg-cyan-500/10 border border-cyan-400/30 active:bg-cyan-500/20 text-cyan-50 py-3.5 rounded-[1.25rem] text-[15px] font-medium transition-colors shadow-[0_0_15px_rgba(6,182,212,0.1)] flex items-center justify-center relative overflow-hidden"
                  >
                    <AnimatePresence>
                      {isRequesting && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-0 bg-cyan-500/20"
                        >
                           <motion.div
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                              className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent skew-x-12"
                           />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <span className="relative z-10">{isRequesting ? 'Requesting...' : 'Request Access'}</span>
                  </motion.button>
                  
                  <motion.button 
                    whileTap={{ scale: 0.96 }}
                    onClick={handleSwitchAccount}
                    className="text-[14px] text-cyan-400 font-medium py-2 active:text-cyan-300 transition-colors"
                  >
                    Try another account
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request Status Modal */}
      <AnimatePresence>
        {requestStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-[#020B1A]/80 backdrop-blur-md rounded-[2.5rem]" />
            <div className="relative w-full max-w-[320px] bg-[#041222] border border-cyan-500/30 p-8 rounded-[2rem] text-center shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
              
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl ${requestStatus === 'success' ? 'bg-teal-500/20 border-teal-500/30 text-teal-400' : 'bg-amber-500/20 border-amber-500/30 text-amber-400'} border`}
              >
                {requestStatus === 'success' ? '✓' : '!'}
              </motion.div>
              
              <h3 className="text-white text-xl font-semibold mb-2">{statusMessage}</h3>
              {requestStatus === 'success' && (
                <p className="text-cyan-100/60 text-sm font-light leading-relaxed">
                  We&apos;ll get back to your email after review.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
