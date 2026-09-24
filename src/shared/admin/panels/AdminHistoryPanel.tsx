"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getHistoryRequests, approveRequest, revokeRequest, deleteRequest, AccessRequest } from '@/app/actions/adminRequests';
import { Clock, Mail, User, ShieldAlert, History, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

export function AdminHistoryPanel() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, email: string} | null>(null);
  const lastFetchTimeRef = useRef(Date.now());

  const fetchRequests = useCallback(async (silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await getHistoryRequests();
      setRequests(data);
      setLastUpdated(new Date());
      lastFetchTimeRef.current = Date.now();
    } catch (error) {
      console.error("Failed to fetch history requests:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleRevoke = async (id: string) => {
    setActionLoading(id);
    // Optimistic status update (zero extra serverless calls)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'revoked' } : r));
    try {
      await revokeRequest(id);
    } catch (error) {
      console.error("Failed to revoke request:", error);
      fetchRequests(true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (id: string, email: string) => {
    setActionLoading(id);
    // Optimistic status update (zero extra serverless calls)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    try {
      await approveRequest(id, email);
    } catch (error) {
      console.error("Failed to restore request:", error);
      fetchRequests(true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    setActionLoading(id);
    // Optimistic removal for snappy UX (zero extra serverless calls)
    setRequests(prev => prev.filter(req => req.id !== id));
    setDeleteConfirm(null);
    try {
      await deleteRequest(id, email);
    } catch (e) {
      console.error("Failed to delete request:", e);
      fetchRequests(true);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Request History
            <span className="bg-cyan-500/20 text-cyan-400 text-sm py-1 px-3 rounded-full font-medium border border-cyan-500/20">
              {requests.length}
            </span>
          </h2>
          <p className="text-zinc-400">View and manage previously reviewed access requests.</p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-zinc-500 hidden sm:inline-block">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchRequests(true)}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0b1622] hover:bg-[#10202c] border border-cyan-500/20 text-cyan-400 text-xs font-medium transition-all shadow-sm disabled:opacity-50"
            title="Refresh history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
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
               <History className="w-8 h-8 text-cyan-500/50" />
            </div>
            <p className="text-lg">No request history</p>
            <p className="text-sm font-light">Past requests will appear here.</p>
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
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <User className="w-4 h-4 shrink-0 text-cyan-400" />
                        <span className="truncate">{request.displayName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Mail className="w-4 h-4 shrink-0 text-zinc-500" />
                        <span className="truncate">{request.email}</span>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className={`shrink-0 px-2.5 py-1 text-xs font-medium rounded-lg border flex items-center justify-center
                      ${request.status === 'approved' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 
                        request.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1 gap-2">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs min-w-0">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{formatDate(request.timestamp)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setDeleteConfirm({ id: request.id, email: request.email })}
                        disabled={actionLoading === request.id}
                        className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors shrink-0"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      {request.status === 'approved' ? (
                         <button
                           onClick={() => handleRevoke(request.id)}
                           disabled={actionLoading === request.id}
                           className="text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                         >
                           {actionLoading === request.id ? '...' : (
                             <>
                               <ShieldAlert className="w-3 h-3 shrink-0" /> Revoke Access
                             </>
                           )}
                         </button>
                      ) : (
                         <button
                           onClick={() => handleRestore(request.id, request.email)}
                           disabled={actionLoading === request.id}
                           className="text-xs font-medium text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                         >
                           {actionLoading === request.id ? '...' : 'Restore Access'}
                         </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#0b1622] border border-red-500/20 shadow-2xl shadow-red-500/10 rounded-2xl p-6 max-w-sm w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
              
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Delete Request?</h3>
                  <p className="text-zinc-400 text-sm">
                    This action cannot be undone. It will permanently remove this record from the database.
                  </p>
                </div>

                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    disabled={actionLoading === deleteConfirm.id}
                    className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.email)}
                    disabled={actionLoading === deleteConfirm.id}
                    className="flex-1 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    {actionLoading === deleteConfirm.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
