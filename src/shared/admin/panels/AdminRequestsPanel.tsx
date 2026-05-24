"use client";

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPendingRequests, approveRequest, rejectRequest, AccessRequest } from '@/app/actions/adminRequests';
import { Check, X, Clock, Mail, User } from 'lucide-react';

export function AdminRequestsPanel() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await getPendingRequests();
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests();
    // Real-time polling fallback
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleApprove = async (id: string, email: string) => {
    setActionLoading(id);
    await approveRequest(id, email);
    setRequests(prev => prev.filter(r => r.id !== id));
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    await rejectRequest(id);
    setRequests(prev => prev.filter(r => r.id !== id));
    setActionLoading(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          Pending Requests
          <span className="bg-cyan-500/20 text-cyan-400 text-sm py-1 px-3 rounded-full font-medium border border-cyan-500/20">
            {requests.length}
          </span>
        </h2>
        <p className="text-zinc-400">Review and approve access for private MYFIT accounts.</p>
      </div>

      <div className="flex-1 w-full bg-[#071018]/50 border border-cyan-500/10 rounded-3xl p-6 backdrop-blur-md overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        
        {isLoading && requests.length === 0 ? (
          <div className="flex w-full h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <div className="w-16 h-16 rounded-full bg-[#10202cb5] flex items-center justify-center mb-4">
               <Check className="w-8 h-8 text-cyan-500/50" />
            </div>
            <p className="text-lg">No pending requests</p>
            <p className="text-sm font-light">All caught up.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max overflow-y-auto max-h-full pr-2 pb-10">
            <AnimatePresence>
              {requests.map(request => (
                <motion.div
                  key={request.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, filter: "blur(5px)" }}
                  className="bg-[#0b1622] border border-cyan-500/10 p-5 rounded-2xl flex flex-col gap-4 shadow-xl"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-white font-medium">
                      <User className="w-4 h-4 text-cyan-400" />
                      {request.displayName}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <Mail className="w-4 h-4 text-zinc-500" />
                      {request.email}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 text-xs mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(request.timestamp)}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => handleApprove(request.id, request.email)}
                      disabled={actionLoading === request.id}
                      className="flex-1 bg-cyan-950/40 hover:bg-teal-500/20 text-teal-400 border border-cyan-500/20 hover:border-teal-500/40 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                      {actionLoading === request.id ? (
                        <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={actionLoading === request.id}
                      className="flex-1 bg-[#151c24] hover:bg-red-500/10 text-red-400/80 hover:text-red-400 border border-white/5 hover:border-red-500/20 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
