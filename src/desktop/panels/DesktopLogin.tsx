import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/shared/store/useAuthStore';
import { submitAccessRequest } from '@/app/actions/accessRequests';
import { OceanicBackground } from '@/shared/components/OceanicBackground';
import { LiveDateTimeBar } from '@/shared/components/LiveDateTimeBar';
import { Logo } from '@/shared/components/Logo';

const words = ["Train.", "Build.", "Transform.", "Stay Consistent.", "Keep Moving."];

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export function DesktopLogin() {
  const login = useAuthStore(state => state.login);
  const error = useAuthStore(state => state.error);
  const logout = useAuthStore(state => state.logout);
  const clearError = useAuthStore(state => state.clearError);
  const authStatus = useAuthStore(state => state.authStatus);
  const requestPayload = useAuthStore(state => state.requestPayload);
  const clearRequestPayload = useAuthStore(state => state.clearRequestPayload);
  
  const [currentWord, setCurrentWord] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'success' | 'duplicate'>('idle');
  const [statusMessage, setStatusMessage] = useState("");

  
  // High-performance cursor tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth spring physics for premium parallax feel
  const smoothMouseX = useSpring(mouseX, { damping: 50, stiffness: 300, mass: 0.5 });
  const smoothMouseY = useSpring(mouseY, { damping: 50, stiffness: 300, mass: 0.5 });

  // Parallax layer transforms
  const normX = useTransform(smoothMouseX, (v) => (v - (typeof window !== 'undefined' ? window.innerWidth / 2 : 960)) / 100);
  const normY = useTransform(smoothMouseY, (v) => (v - (typeof window !== 'undefined' ? window.innerHeight / 2 : 540)) / 100);

  const textParallaxX = useTransform(normX, (v) => v * -1.5);
  const textParallaxY = useTransform(normY, (v) => v * -1.5);

  const authParallaxX = useTransform(normX, (v) => v * 1.5);
  const authParallaxY = useTransform(normY, (v) => v * 1.5);

  useEffect(() => {
    
    if (typeof window !== 'undefined') {
      mouseX.set(window.innerWidth / 2);
      mouseY.set(window.innerHeight / 2);
    }
    
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [mouseX, mouseY]);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  const handleSwitchAccount = async () => {
    await logout();
    clearError();
    clearRequestPayload();
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


  const isAuthLoading = authStatus === 'loading' || authStatus === 'success';

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="relative flex h-screen w-full bg-[#020B1A] overflow-hidden selection:bg-cyan-500/30 font-sans"
    >
      <OceanicBackground isAuthLoading={isAuthLoading} interactive={true} variant="full" />

      {/* HEADER LOGO & LIVE TIME BAR */}
      <div className="absolute top-12 inset-x-12 lg:inset-x-24 z-20 flex items-center justify-between pointer-events-none">
        
        {/* Logo (Left) */}
        <div className="flex items-center gap-4 pointer-events-auto shrink-0">
          <div className="h-12 w-12 flex items-center justify-center shrink-0 shadow-lg shadow-black/20 rounded-2xl overflow-hidden">
            <Logo />
          </div>
          <span className="text-cyan-50 text-xl font-bold tracking-tight">MYFIT</span>
        </div>

        {/* Live Date Time Bar (Perfectly Centered) */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto hidden md:block">
          <LiveDateTimeBar />
        </div>
        
        {/* Spacer for Right Side balance */}
        <div className="hidden md:block w-[140px] shrink-0" />
      </div>

      {/* COMPOSITION CONTAINER - Vertically Centered */}
      <div className="relative z-10 w-full h-full flex flex-col lg:flex-row items-center max-w-[1600px] mx-auto">
        
        {/* LEFT SIDE: Typography Grid */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center px-12 xl:px-24 h-full">
          <motion.div 
            style={{ x: textParallaxX, y: textParallaxY }}
            className="max-w-xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-6xl xl:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1] flex flex-col">
                <span className="text-cyan-50/70 text-4xl xl:text-5xl mb-2 font-medium tracking-normal">Ready to</span>
                <span className="relative h-[80px] xl:h-[100px] overflow-hidden block">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={currentWord}
                      initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -40, filter: "blur(8px)" }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-0 top-0 text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-teal-200"
                    >
                      {words[currentWord]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </h2>
              <p className="text-cyan-100/70 text-xl xl:text-2xl leading-relaxed font-light mt-4 max-w-md drop-shadow-sm">
                Your intelligent space to track workouts, build consistency, and engineer real progress.
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* RIGHT SIDE: Immersive Authentication */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-8 lg:px-24 h-full">
          <motion.div
            style={{ x: authParallaxX, y: authParallaxY }}
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            className="w-full max-w-[400px] flex flex-col relative"
          >
            {/* Cinematic background glow directly tied to the auth area */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.06)_0%,transparent_70%)] pointer-events-none" />

            <div className="flex flex-col items-center mb-10 relative z-10 text-center">
              <h1 className="text-4xl xl:text-5xl font-semibold tracking-tight text-white mb-4">
                Welcome back
              </h1>
              <p className="text-cyan-100/60 text-lg font-light">
                Sign in to continue your journey.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {(error === 'unauthorized' || error === 'pending' || error === 'rejected' || authStatus === 'approved') && (
                <motion.div 
                  key={error || authStatus}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full mb-8 flex flex-col gap-5 relative"
                >
                  {/* Premium ambient glow for state */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${authStatus === 'approved' ? 'from-teal-500/10 to-emerald-500/5' : error === 'rejected' ? 'from-red-500/5 to-rose-500/5' : error === 'pending' ? 'from-amber-500/5 to-orange-500/5' : 'from-cyan-500/5 to-purple-500/5'} rounded-3xl blur-xl transition-colors duration-500`} />
                  
                  {/* Message Block */}
                  <div className={`relative w-full bg-[#041222]/80 border ${authStatus === 'approved' ? 'border-teal-500/30 shadow-[0_8px_32px_rgba(20,184,166,0.15)]' : error === 'rejected' ? 'border-red-500/20 shadow-[0_8px_32px_rgba(239,68,68,0.1)]' : error === 'pending' ? 'border-amber-500/20 shadow-[0_8px_32px_rgba(245,158,11,0.1)]' : 'border-cyan-500/20 shadow-[0_8px_32px_rgba(6,182,212,0.1)]'} p-6 rounded-3xl backdrop-blur-xl overflow-hidden group transition-all duration-500`}>
                    <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent ${authStatus === 'approved' ? 'via-teal-400/40' : error === 'rejected' ? 'via-red-400/40' : error === 'pending' ? 'via-amber-400/40' : 'via-cyan-400/40'} to-transparent opacity-50`} />
                    <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent ${authStatus === 'approved' ? 'via-emerald-400/20' : error === 'rejected' ? 'via-rose-400/20' : error === 'pending' ? 'via-orange-400/20' : 'via-teal-400/20'} to-transparent opacity-50`} />
                    
                    <div className="flex items-start gap-4">
                      {/* Soft Animated Icon */}
                      <motion.div 
                        animate={{ 
                          boxShadow: authStatus === 'approved' ? ["0 0 0px rgba(20,184,166,0)", "0 0 15px rgba(20,184,166,0.3)", "0 0 0px rgba(20,184,166,0)"] : error === 'rejected' ? ["0 0 0px rgba(239,68,68,0)", "0 0 15px rgba(239,68,68,0.2)", "0 0 0px rgba(239,68,68,0)"] : error === 'pending' ? ["0 0 0px rgba(245,158,11,0)", "0 0 15px rgba(245,158,11,0.2)", "0 0 0px rgba(245,158,11,0)"] : ["0 0 0px rgba(45,212,191,0)", "0 0 15px rgba(45,212,191,0.2)", "0 0 0px rgba(45,212,191,0)"] 
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className={`flex-shrink-0 w-10 h-10 rounded-full ${authStatus === 'approved' ? 'bg-teal-950/40 border-teal-500/40' : error === 'rejected' ? 'bg-red-950/40 border-red-500/30' : error === 'pending' ? 'bg-amber-950/40 border-amber-500/30' : 'bg-cyan-950/40 border-cyan-500/30'} border flex items-center justify-center mt-1`}
                      >
                        {authStatus === 'approved' ? (
                          <span className="text-teal-400 text-lg">✓</span>
                        ) : error === 'rejected' ? (
                          <span className="text-red-400 text-lg">✕</span>
                        ) : error === 'pending' ? (
                          <span className="text-amber-400 text-lg">⏳</span>
                        ) : (
                          <span className="text-cyan-300/80 text-lg">🔒</span>
                        )}
                      </motion.div>
                      
                      <div className="flex flex-col gap-2 text-left">
                        <p className="text-white font-medium text-[15px] leading-snug">
                          {authStatus === 'approved' ? (
                            <>Access Granted 👋<br/>Your account has been approved.</>
                          ) : error === 'rejected' ? (
                            <>Access Unavailable<br/>This account request was not approved.</>
                          ) : error === 'pending' ? (
                            <>Request Under Review<br/>Your request is still being reviewed.</>
                          ) : (
                            <>Ohoo 👋<br/>Looks like your account doesn&apos;t currently have access to this private MYFIT space.</>
                          )}
                        </p>
                        <p className={`text-sm font-light leading-relaxed ${authStatus === 'approved' ? 'text-teal-100/70' : error === 'rejected' ? 'text-red-100/60' : error === 'pending' ? 'text-amber-100/60' : 'text-cyan-100/60'}`}>
                          {authStatus === 'approved' ? (
                            <span className="flex items-center gap-2">
                              <motion.span
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                className="w-1.5 h-1.5 rounded-full bg-teal-400"
                              />
                              Preparing your MYFIT workspace...
                            </span>
                          ) : error === 'rejected' ? (
                            'Try another account or request access later.'
                          ) : error === 'pending' ? (
                            'We will notify you once an admin has reviewed your request.'
                          ) : (
                            'This personal fitness system is currently limited to approved accounts only.'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {authStatus !== 'approved' && (
                    <div className="flex flex-col items-center gap-5 relative z-10 mt-1">
                      {error === 'unauthorized' && (
                        <motion.button
                          onClick={handleRequestAccess}
                          disabled={isRequesting}
                          whileHover={!isRequesting ? { scale: 1.02 } : {}}
                          whileTap={!isRequesting ? { scale: 0.98 } : {}}
                          className="w-full bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/20 hover:border-cyan-400/40 text-cyan-50 py-3.5 rounded-2xl text-[15px] font-medium transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] flex items-center justify-center gap-2 group overflow-hidden relative"
                        >
                          <AnimatePresence>
                            {isRequesting && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-0 bg-cyan-900/40"
                              >
                                <motion.div
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent skew-x-12"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <span className="relative z-10">{isRequesting ? 'Requesting...' : 'Request Access'}</span>
                          {!isRequesting && (
                            <motion.span 
                              className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 relative z-10"
                            >
                              →
                            </motion.span>
                          )}
                        </motion.button>
                      )}
                      
                      {error === 'rejected' && (
                        <motion.button
                          onClick={handleRequestAccess}
                          disabled={isRequesting}
                          whileHover={!isRequesting ? { scale: 1.02 } : {}}
                          whileTap={!isRequesting ? { scale: 0.98 } : {}}
                          className="w-full bg-red-950/20 hover:bg-red-900/40 border border-red-500/20 hover:border-red-400/40 text-red-50 py-3.5 rounded-2xl text-[15px] font-medium transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.05)] flex items-center justify-center gap-2 group overflow-hidden relative"
                        >
                          <AnimatePresence>
                            {isRequesting && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-0 bg-red-900/40"
                              >
                                <motion.div
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-red-400/20 to-transparent skew-x-12"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <span className="relative z-10">{isRequesting ? 'Requesting...' : 'Request Again'}</span>
                        </motion.button>
                      )}
                      
                      {error === 'pending' && (
                        <motion.button
                          onClick={() => {
                            clearError();
                            clearRequestPayload();
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-amber-950/20 hover:bg-amber-900/30 border border-amber-500/20 hover:border-amber-400/40 text-amber-50 py-3.5 rounded-2xl text-[15px] font-medium transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.05)] flex items-center justify-center gap-2 group"
                        >
                          Close
                        </motion.button>
                      )}
                      
                      <div className="flex flex-col items-center gap-1.5">
                        {error === 'unauthorized' && <span className="text-[13px] text-cyan-100/40">Think this is a mistake?</span>}
                        <button 
                          onClick={handleSwitchAccount}
                          className={`text-[14px] ${error === 'rejected' ? 'text-red-400 hover:text-red-300' : error === 'pending' ? 'text-amber-400 hover:text-amber-300' : 'text-cyan-400 hover:text-cyan-300'} font-medium transition-all duration-300 relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[1px] ${error === 'rejected' ? 'after:bg-red-400/30' : error === 'pending' ? 'after:bg-amber-400/30' : 'after:bg-cyan-400/30'} after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:origin-left`}
                        >
                          Try another Google account
                        </button>
                      </div>
                    </div>
                  )}
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
                  <div className="absolute inset-0 bg-[#020B1A]/80 backdrop-blur-md rounded-3xl" />
                  <div className="relative w-full max-w-[320px] bg-[#041222] border border-cyan-500/30 p-8 rounded-3xl text-center shadow-2xl overflow-hidden">
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

            <div className="relative w-full z-10 group mt-2">
              {/* Premium Button Glow - reacts to hover */}
              <div className="absolute -inset-3 bg-gradient-to-r from-cyan-500/20 via-teal-400/20 to-sky-500/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none" />
              
              <motion.div
                whileHover={!isAuthLoading ? { scale: 1.02 } : {}}
                whileTap={!isAuthLoading ? { scale: 0.98 } : {}}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button 
                  onClick={login}
                  disabled={isAuthLoading}
                  className="relative w-full bg-white/5 hover:bg-white/10 text-white h-[68px] rounded-3xl text-[16px] font-medium transition-colors duration-500 overflow-hidden border border-white/10 hover:border-white/20 hover:shadow-[0_0_40px_rgba(45,212,191,0.2)] group/btn backdrop-blur-md"
                >
                  {/* Magnetic shine effect */}
                  <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover/btn:translate-x-[100%] ease-in-out pointer-events-none" />
                  
                  {/* Soft inner glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.1)_0%,transparent_100%)] pointer-events-none" />

                  {/* Premium Shimmer Loader */}
                  <AnimatePresence>
                    {isAuthLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-0 overflow-hidden rounded-3xl bg-white/5"
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
                      animate={{ opacity: isAuthLoading ? 0.8 : 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {isAuthLoading ? 'Authenticating...' : 'Continue with Google'}
                    </motion.span>
                  </div>
                </Button>
              </motion.div>
            </div>
            
            <div className="mt-10 flex justify-center text-center relative z-10">
              <p className="text-[11px] text-cyan-100/40 font-medium tracking-[0.2em] uppercase">
                Secure Enterprise Authentication
              </p>
            </div>
            
          </motion.div>
        </div>
      </div>
    </div>
  );
}
