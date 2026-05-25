import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTrainingJournalStore, TrainingNote } from '@/shared/store/useTrainingJournalStore';
import { useAuthStore } from '@/shared/store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { MobilePageWrapper } from '../layout/MobilePageWrapper';

interface MobileNoteEditorProps {
  noteId: string;
  onBack: () => void;
}

export function MobileNoteEditor({ noteId, onBack }: MobileNoteEditorProps) {
  const { 
    syncStatus, 
    setSyncStatus, 
    conflictState, 
    loadNote, 
    saveNoteLocal, 
    syncNoteToFirebase 
  } = useTrainingJournalStore();
  
  const user = useAuthStore(state => state.user);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<string>('');
  const titleContentRef = useRef<string>('');
  
  const [charCount, setCharCount] = useState(0);
  const [lastSyncedAtLocal, setLastSyncedAtLocal] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isSyncingRef = useRef(false);

  // Initialize and load
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      const note = await loadNote(noteId);
      
      if (mounted && note) {
        contentRef.current = note.content;
        titleContentRef.current = note.title || '';
        setCharCount(note.content.length);
        setLastSyncedAtLocal(note.lastSyncedAt);
        if (textareaRef.current) {
          textareaRef.current.value = note.content;
        }
        if (titleRef.current) {
          titleRef.current.value = note.title || '';
        }
        setIsInitializing(false);
      } else if (mounted) {
        // If note doesn't exist locally, bail out
        onBack();
      }
    };
    
    init();
    
    return () => {
      mounted = false;
      clearAllTimers();
    };
  }, [noteId, loadNote, onBack]);

  const clearAllTimers = () => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    retryTimeoutsRef.current.forEach(clearTimeout);
    retryTimeoutsRef.current = [];
  };

  const attemptSync = async (retryCount = 0) => {
    if (isSyncingRef.current || !user) return;
    
    isSyncingRef.current = true;
    
    try {
      const noteToSync: TrainingNote = {
        id: noteId,
        title: titleContentRef.current,
        content: contentRef.current,
        createdAt: Date.now(), // Will be overwritten by merge, but need original if possible. For simplicity it's fine.
        updatedAt: Date.now(),
        lastSyncedAt: lastSyncedAtLocal || Date.now(),
        isDraft: true
      };
      
      await syncNoteToFirebase(noteToSync);
      isSyncingRef.current = false;
      setLastSyncedAtLocal(Date.now());
    } catch (error) {
      isSyncingRef.current = false;
      setSyncStatus('error');
      
      const delays = [2000, 5000, 10000, 30000];
      if (retryCount < delays.length) {
        const timeoutId = setTimeout(() => {
          attemptSync(retryCount + 1);
        }, delays[retryCount]);
        retryTimeoutsRef.current.push(timeoutId);
      }
    }
  };

  const queueSync = useCallback(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    setSyncStatus('saving');
    
    syncTimeoutRef.current = setTimeout(() => {
      attemptSync(0);
    }, 3000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, lastSyncedAtLocal, user]);

  const handleTitleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    titleContentRef.current = newTitle;
    
    const now = Date.now();
    saveNoteLocal({
      id: noteId,
      title: newTitle,
      content: contentRef.current,
      createdAt: now,
      updatedAt: now,
      lastSyncedAt: lastSyncedAtLocal || now,
      isDraft: true
    }).catch(console.error);
    
    queueSync();
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    contentRef.current = newContent;
    setCharCount(newContent.length);
    
    const now = Date.now();
    saveNoteLocal({
      id: noteId,
      title: titleContentRef.current,
      content: newContent,
      createdAt: now,
      updatedAt: now,
      lastSyncedAt: lastSyncedAtLocal || now,
      isDraft: true
    }).catch(console.error);
    
    queueSync();
  };

  // App-close protection
  useEffect(() => {
    const forceSave = () => {
      if (isInitializing) return;
      const now = Date.now();
      saveNoteLocal({
        id: noteId,
        title: titleContentRef.current,
        content: contentRef.current,
        createdAt: now,
        updatedAt: now,
        lastSyncedAt: lastSyncedAtLocal || now,
        isDraft: true
      }).catch(console.error);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        forceSave();
      }
    };
    
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', forceSave);
    
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', forceSave);
    };
  }, [noteId, lastSyncedAtLocal, saveNoteLocal, isInitializing]);
  
  // Network recovery
  useEffect(() => {
    const handleOnline = () => {
      const currentStatus = useTrainingJournalStore.getState().syncStatus;
      if (currentStatus === 'error' || currentStatus === 'offline') {
        queueSync();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [queueSync]);

  const getStatusDisplay = () => {
    if (conflictState) return '🔴 Conflict';
    switch (syncStatus) {
      case 'saving': return '🟡 Saving...';
      case 'syncing': return '🔵 Syncing...';
      case 'error': return '🔴 Sync failed';
      case 'offline': return '⚪ Offline';
      case 'synced': default: return '🟢 Saved';
    }
  };

  const isWarning = charCount > 4000;
  const isCritical = charCount > 4500;
  
  const handleDelete = async () => {
    await useTrainingJournalStore.getState().deleteNote(noteId);
    setShowDeleteConfirm(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full h-full bg-[#020B1A]"
    >
      <MobilePageWrapper 
        title={
          <div className="flex items-center gap-2 -ml-2">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="w-7 h-7 text-white" />
            </button>
            <span className="text-3xl font-semibold tracking-tight text-white">Journal</span>
          </div>
        }
        subtitle={
          <div className="ml-11">Capture workout thoughts</div>
        }
        headerRight={
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="p-3 -mr-2 bg-red-500/10 hover:bg-red-500/20 rounded-full transition-colors flex items-center justify-center border border-red-500/20"
          >
            <Trash2 className="w-5 h-5 text-red-400" />
          </button>
        }
        className="bg-transparent"
        contentClassName="!pb-[env(safe-area-inset-bottom,24px)] flex flex-col"
      >
        {/* Date Row */}
        <div className="flex justify-between items-center mb-4 mt-2 text-xs font-medium text-zinc-500">
          <div>{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <div className="flex items-center gap-2">
            <span>{getStatusDisplay()}</span>
          </div>
        </div>

        {conflictState && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded-xl text-sm flex justify-between items-center border border-red-500/30 mb-4 shrink-0">
            <span>Updated on another device</span>
            <button onClick={() => window.location.reload()} className="px-3 py-1 bg-red-500/30 rounded-md font-medium text-red-300">Reload</button>
          </div>
        )}

        {/* Editor Card */}
        <div 
          className="bg-white/[0.03] border border-white/[0.08] rounded-3xl backdrop-blur-xl p-6 min-h-[45vh] max-h-[65vh] flex flex-col relative w-full shadow-2xl shrink-0 touch-pan-y"
          style={{ 
            transform: 'translateZ(0)', 
            willChange: 'transform' 
          }}
        >
          {isInitializing ? (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-500">Loading...</div>
          ) : (
            <>
              <input
                ref={titleRef}
                onChange={handleTitleInput}
                placeholder="Title"
                className="w-full bg-transparent text-white font-semibold text-2xl placeholder:text-zinc-600 outline-none mb-4 shrink-0"
              />
              <textarea
                ref={textareaRef}
                onChange={handleInput}
                placeholder="Tap to start writing..."
                className="flex-1 w-full h-full bg-transparent text-zinc-100 placeholder:text-zinc-600 resize-none outline-none text-lg leading-relaxed hide-scrollbar"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain'
                }}
              />
            </>
          )}
        </div>

        {/* Character counter */}
        <div className={`mt-4 text-xs text-right font-medium shrink-0 ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-zinc-500'}`}>
          {charCount} / 5000
        </div>
      </MobilePageWrapper>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowDeleteConfirm(false)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="relative w-full max-w-sm bg-[#0a1120] border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-semibold text-white mb-2">Delete Note?</h3>
              <p className="text-zinc-400 text-sm mb-6">This action cannot be undone. The note will be permanently removed.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)} 
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete} 
                  className="flex-1 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold transition-colors border border-red-500/30"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
