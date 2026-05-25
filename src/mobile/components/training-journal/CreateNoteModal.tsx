import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CreateNoteModalProps {
  onClose: () => void;
  onCreate: (title: string, content: string) => void;
}

export function CreateNoteModal({ onClose, onCreate }: CreateNoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleCreate = () => {
    // If title is set, prepend it to content to save as first line, 
    // or just let the content have it. But since we use first line as title fallback,
    // if they enter a title, we just prepend it to the content if they want. 
    // Or we just save the title as the first line of content implicitly.
    const fullContent = title ? `${title}\n\n${content}` : content;
    onCreate(title, fullContent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      {/* Modal */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-sm bg-[#0a1120] border border-white/10 rounded-3xl p-6 shadow-2xl"
      >
        <h3 className="text-xl font-semibold text-white mb-6">Create Note</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 font-medium ml-1 mb-1 block">Title (Optional)</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Chest Progress"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
          
          <div>
            <label className="text-xs text-zinc-400 font-medium ml-1 mb-1 block">Content</label>
            <textarea 
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Start writing..."
              rows={4}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none scrollbar-thin scrollbar-thumb-white/10"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-8">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={!title && !content}
            className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:hover:bg-cyan-500 text-black font-semibold transition-colors shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            Create
          </button>
        </div>
      </motion.div>
    </div>
  );
}
