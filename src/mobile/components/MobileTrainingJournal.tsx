import React, { useState, useEffect } from 'react';
import { MobilePageWrapper } from './layout/MobilePageWrapper';
import { useTrainingJournalStore, NoteMetadata } from '@/shared/store/useTrainingJournalStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen } from 'lucide-react';
import { NoteCard } from './training-journal/NoteCard';
import { MobileNoteEditor } from './training-journal/MobileNoteEditor';
import { CreateNoteModal } from './training-journal/CreateNoteModal';
import { NoteActionSheet } from './training-journal/NoteActionSheet';

export function MobileTrainingJournal() {
  const { 
    noteMetadataList,
    activeNoteId,
    setActiveNoteId,
    createNote,
    deleteNote,
    duplicateNote,
    togglePin
  } = useTrainingJournalStore();
  
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [actionSheetMeta, setActionSheetMeta] = useState<NoteMetadata | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Initial load logic - maybe we should hydrate IDB metadata, but zustand persist already has the list.
  
  const handleQuickTemplate = async (type: string) => {
    let content = '';
    switch (type) {
      case 'Chest':
        content = "Today's Chest Session\n\nBench:\nIncline:\nFly:\n\nNotes:";
        break;
      case 'Diet':
        content = "Today's Diet Notes\n\nBreakfast:\nLunch:\nDinner:\n\nNotes:";
        break;
      case 'Progress':
        content = "Progress Notes\n\nWeight:\nStrength:\nMood:\n\nNotes:";
        break;
      case 'Reminder':
        content = "Reminder\n\n• \n• \n• ";
        break;
    }
    const newId = await createNote(content);
    setActiveNoteId(newId);
  };

  const handleCreateSubmit = async (title: string, content: string) => {
    const newId = await createNote(content);
    setCreateModalOpen(false);
    // Optionally open the newly created note immediately
    // setActiveNoteId(newId); 
  };
  
  const performDelete = async (id: string) => {
    await deleteNote(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="w-full h-full relative">
      <AnimatePresence mode="wait">
        {activeNoteId ? (
          <MobileNoteEditor 
            key="editor" 
            noteId={activeNoteId} 
            onBack={() => setActiveNoteId(null)} 
          />
        ) : (
          <motion.div 
            key="home"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <MobilePageWrapper 
              title="Training Journal" 
              subtitle="Capture workout thoughts"
              className="bg-[#020B1A]"
              contentClassName={`!px-4 flex flex-col ${noteMetadataList.length > 0 ? '!pb-24' : '!pb-0'}`}
            >
              {/* Quick Actions */}
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4 shrink-0">
                {['Chest', 'Diet', 'Progress', 'Reminder'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleQuickTemplate(type)}
                    className="shrink-0 px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-full text-sm font-medium text-zinc-300 whitespace-nowrap transition-colors"
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Notes List or Empty State */}
              {noteMetadataList.length === 0 ? (
                <div 
                  className="flex-1 flex flex-col items-center justify-center w-full min-h-[50dvh]"
                  style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
                >
                  <div 
                    className="flex flex-col items-center text-center gap-4 max-w-[300px] w-full"
                    style={{ transform: 'translateY(-3dvh)' }}
                  >
                    <div className="w-[clamp(5rem,15vw,6rem)] h-[clamp(5rem,15vw,6rem)] bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full flex items-center justify-center mb-2 border border-cyan-500/10 shrink-0">
                      <BookOpen className="w-[clamp(2.5rem,8vw,3rem)] h-[clamp(2.5rem,8vw,3rem)] text-cyan-400" />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <h3 className="text-[clamp(1.125rem,4vw,1.25rem)] font-semibold text-white">No notes yet</h3>
                      <p className="text-zinc-500 text-[clamp(0.875rem,3vw,0.9rem)] leading-relaxed">
                        Track workout ideas, trainer advice, progress notes and reminders.
                      </p>
                    </div>

                    <button 
                      onClick={() => setCreateModalOpen(true)}
                      className="w-[min(280px,80%)] mt-2 px-6 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-full flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0"
                    >
                      <Plus className="w-5 h-5" />
                      Create Note
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 mt-2 relative">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-1">
                      Recent Notes
                    </div>
                    <AnimatePresence>
                      {noteMetadataList.map((meta) => (
                        <motion.div
                          key={meta.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                        >
                          <NoteCard 
                            meta={meta}
                            onClick={() => setActiveNoteId(meta.id)}
                            onPin={() => togglePin(meta.id)}
                            onDelete={() => setDeleteConfirmId(meta.id)}
                            onLongPress={() => setActionSheetMeta(meta)}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}              {/* FAB */}
              {noteMetadataList.length > 0 && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCreateModalOpen(true)}
                  className="absolute bottom-6 right-6 w-14 h-14 bg-cyan-500 hover:bg-cyan-400 text-black rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(6,182,212,0.4)] z-40 transition-colors"
                >
                  <Plus className="w-6 h-6" />
                </motion.button>
              )}
            </MobilePageWrapper>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateNoteModal 
            onClose={() => setCreateModalOpen(false)} 
            onCreate={handleCreateSubmit} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {actionSheetMeta && (
          <NoteActionSheet 
            isPinned={actionSheetMeta.isPinned}
            onClose={() => setActionSheetMeta(null)}
            onEdit={() => setActiveNoteId(actionSheetMeta.id)}
            onPin={() => togglePin(actionSheetMeta.id)}
            onDuplicate={async () => {
              const newId = await duplicateNote(actionSheetMeta.id);
              if (newId) setActiveNoteId(newId);
            }}
            onDelete={() => setDeleteConfirmId(actionSheetMeta.id)}
          />
        )}
      </AnimatePresence>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirmId(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-[#0a1120] border border-white/10 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-xl font-semibold text-white mb-2">Delete Note?</h3>
              <p className="text-zinc-400 text-sm mb-6">This action cannot be undone. The note will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors">Cancel</button>
                <button onClick={() => performDelete(deleteConfirmId)} className="flex-1 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold transition-colors border border-red-500/30">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
