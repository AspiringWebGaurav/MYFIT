"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { adminLogin } from '@/app/actions/adminAuth';
import { OceanicBackground } from '@/shared/components/OceanicBackground';
import { Logo } from '@/shared/components/Logo';
import { useRouter } from 'next/navigation';

export function AdminLoginClient() {
  const [adminKey, setAdminKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey) return;
    
    setIsLoading(true);
    setError('');
    
    const result = await adminLogin(adminKey);
    
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || 'Authentication failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full bg-[#020B1A] overflow-hidden font-sans items-center justify-center">
      <OceanicBackground isAuthLoading={isLoading} interactive={true} variant="full" />

      <motion.div
        initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px] flex flex-col relative z-10 px-6"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.06)_0%,transparent_70%)] pointer-events-none" />

        <div className="flex flex-col items-center mb-8 relative z-10 text-center">
          <div className="h-16 w-16 flex items-center justify-center mb-6 shadow-lg shadow-black/20 rounded-2xl overflow-hidden">
             <Logo />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">
            System Admin
          </h1>
          <p className="text-cyan-100/60 text-base font-light">
            Secure clearance required.
          </p>
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4 relative z-10">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group">
             <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
             <input
               type="password"
               placeholder="Admin Key"
               value={adminKey}
               onChange={(e) => setAdminKey(e.target.value)}
               className="relative w-full bg-[#041222]/80 border border-cyan-500/30 focus:border-cyan-400 text-white px-5 py-4 rounded-2xl outline-none backdrop-blur-xl transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
             />
          </div>

          <div className="relative w-full group mt-4">
            <div className="absolute -inset-3 bg-gradient-to-r from-cyan-500/20 via-teal-400/20 to-sky-500/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-700 pointer-events-none" />
            <motion.div whileHover={!isLoading ? { scale: 1.02 } : {}} whileTap={!isLoading ? { scale: 0.98 } : {}}>
              <Button 
                type="submit"
                disabled={isLoading || !adminKey}
                className="relative w-full bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-50 h-[60px] rounded-2xl text-[16px] font-medium transition-colors duration-500 overflow-hidden border border-cyan-500/30 hover:border-cyan-400/50 backdrop-blur-md"
              >
                <span className="relative z-10">{isLoading ? 'Authenticating...' : 'Enter System'}</span>
              </Button>
            </motion.div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
