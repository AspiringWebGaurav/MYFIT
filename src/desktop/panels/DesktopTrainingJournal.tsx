import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrainingJournalStore, NoteMetadata } from '@/shared/store/useTrainingJournalStore';
import { Plus, BookOpen, Trash2, Edit3, X, Save } from 'lucide-react';
import { useDesktopShortcuts } from '@/shared/hooks/useDesktopShortcuts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DesktopTrainingJournal() {
  const { 
    noteMetadataList,
    activeNoteId,
    setActiveNoteId,
    createNote,
    deleteNote,
    loadNote,
    saveNoteLocal,
    syncNoteToFirebase
  } = useTrainingJournalStore();

  const [activeContent, setActiveContent] = useState('');
  const [activeTitle, setActiveTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load content when active note changes
  React.useEffect(() => {
    if (activeNoteId) {
      loadNote(activeNoteId).then(note => {
        setActiveContent(note?.content || '');
        const meta = noteMetadataList.find(n => n.id === activeNoteId);
        setActiveTitle(note?.title || meta?.previewTitle || 'Untitled');
      });
    } else {
      setActiveContent('');
      setActiveTitle('');
    }
  }, [activeNoteId, loadNote, noteMetadataList]);

  // Auto-save logic
  React.useEffect(() => {
    if (!activeNoteId) return;
    const timer = setTimeout(async () => {
      setIsSaving(true);
      // Wait a moment for UX
      await new Promise(r => setTimeout(r, 400));
      
      const existing = await loadNote(activeNoteId);
      if (existing) {
        const updated = {
          ...existing,
          title: activeTitle,
          content: activeContent,
          updatedAt: Date.now(),
          isDraft: true
        };
        await saveNoteLocal(updated);
        syncNoteToFirebase(updated).catch(() => {});
      }
      
      setIsSaving(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeContent, activeTitle, activeNoteId, loadNote, saveNoteLocal, syncNoteToFirebase]);

  const handleCreateNew = async () => {
    const newId = await createNote("New note content...");
    setActiveNoteId(newId);
  };

  const handleQuickTemplate = async (type: string) => {
    let content = '';
    let title = type + ' Notes';
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
    const existing = await loadNote(newId);
    if (existing) {
      const updated = { ...existing, title, content };
      await saveNoteLocal(updated);
      syncNoteToFirebase(updated).catch(() => {});
    }
    setActiveNoteId(newId);
  };

  useDesktopShortcuts([
    {
      combo: { key: 'n', ctrlKey: true },
      handler: () => handleCreateNew(),
    },
    {
      combo: { key: 'Escape' },
      handler: () => setActiveNoteId(null),
    },
    {
      combo: { key: 'Delete' },
      handler: () => {
        if (activeNoteId) {
          deleteNote(activeNoteId);
          setActiveNoteId(null);
        }
      },
    }
  ], [activeNoteId]);

  return (
    <div className="flex flex-col gap-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-start justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-white">Training Journal</h2>
          <p className="text-zinc-400 mt-1">Capture your workout thoughts.</p>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 gap-6 overflow-hidden">
        {/* Left Column: Note List */}
        <Card className="w-1/3 flex flex-col p-4 bg-[#0b1620a8] border-cyan-400/10 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Recent Notes</span>
            <Button size="sm" variant="outline" onClick={handleCreateNew} className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20">
              <Plus className="w-4 h-4 mr-2" />
              New <span className="ml-1 text-[10px] opacity-60 bg-black/30 px-1 rounded">Ctrl+N</span>
            </Button>
          </div>
          
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {noteMetadataList.map(meta => (
                <motion.div
                  key={meta.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setActiveNoteId(meta.id)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all ${
                    activeNoteId === meta.id 
                      ? 'bg-cyan-500/10 border-cyan-500/40' 
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                  }`}
                >
                  <h4 className="text-sm font-medium text-white line-clamp-1">{meta.previewTitle || 'Untitled Note'}</h4>
                  <p className="text-xs text-zinc-500 mt-1">{new Date(meta.updatedAt).toLocaleDateString()}</p>
                </motion.div>
              ))}
              {noteMetadataList.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <BookOpen className="w-8 h-8 text-zinc-600 mb-3" />
                  <p className="text-sm text-zinc-500">No notes found.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Center & Right Area */}
        <div className="flex-1 flex gap-6 overflow-hidden">
          {activeNoteId ? (
            <>
              {/* Editor Column */}
              <Card className="flex-1 flex flex-col bg-[#0b1620a8] border-cyan-400/10 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl p-0 overflow-hidden relative group">
                <div className="p-4 border-b border-cyan-400/10 flex items-center justify-between shrink-0">
                  <input 
                    type="text" 
                    value={activeTitle}
                    onChange={(e) => setActiveTitle(e.target.value)}
                    className="bg-transparent border-none outline-none text-xl font-medium text-white flex-1 min-w-0 px-2"
                    placeholder="Note Title..."
                  />
                  <div className="flex items-center gap-3">
                    <AnimatePresence>
                      {isSaving && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center text-xs text-cyan-400 gap-1.5">
                          <Save className="w-3.5 h-3.5 animate-pulse" />
                          Saving...
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button onClick={() => setActiveNoteId(null)} className="p-2 text-zinc-500 hover:text-white transition-colors" title="Close (Esc)">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <textarea 
                  value={activeContent}
                  onChange={(e) => setActiveContent(e.target.value)}
                  className="flex-1 w-full bg-transparent border-none outline-none p-6 text-zinc-300 resize-none font-sans leading-relaxed text-sm focus:ring-0"
                  placeholder="Start writing..."
                />
              </Card>

              {/* Right Context Column */}
              <div className="w-64 flex flex-col gap-6 shrink-0 overflow-y-auto">
                <Card className="p-4 bg-[#0b1620a8] border-cyan-400/10 backdrop-blur-xl flex flex-col gap-3">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Note Info</span>
                  <div className="text-sm text-zinc-400">
                    <div className="flex justify-between py-1">
                      <span>Status</span>
                      <span className="text-zinc-200">Local</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Words</span>
                      <span className="text-zinc-200">{activeContent.trim() ? activeContent.trim().split(/\s+/).length : 0}</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      deleteNote(activeNoteId);
                      setActiveNoteId(null);
                    }}
                    className="w-full mt-2 bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Note <span className="ml-2 text-[10px] opacity-60">Del</span>
                  </Button>
                </Card>
              </div>
            </>
          ) : (
            <Card className="flex-1 flex flex-col items-center justify-center bg-[#0b1620a8] border-cyan-400/10 backdrop-blur-xl text-center p-8">
              <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6">
                <Edit3 className="w-10 h-10 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">Select a Note</h3>
              <p className="text-zinc-400 max-w-sm mb-8">Choose an existing note from the list, or create a new one.</p>
              
              <div className="flex gap-3 flex-wrap justify-center max-w-md">
                {['Chest', 'Diet', 'Progress', 'Reminder'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleQuickTemplate(type)}
                    className="px-4 py-2 bg-[#10202cb5] hover:bg-[#152a3bb5] border border-cyan-400/10 rounded-full text-sm font-medium text-zinc-300 transition-colors"
                  >
                    {type} Template
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
