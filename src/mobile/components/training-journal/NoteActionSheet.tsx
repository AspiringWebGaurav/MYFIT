import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Pin, Copy, Trash2 } from 'lucide-react';

interface NoteActionSheetProps {
  onClose: () => void;
  onEdit: () => void;
  onPin: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isPinned: boolean;
}

export function NoteActionSheet({ onClose, onEdit, onPin, onDuplicate, onDelete, isPinned }: NoteActionSheetProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-8">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      {/* Sheet */}
      <motion.div 
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-sm bg-[#0a1120] border border-white/10 rounded-3xl p-2 shadow-2xl"
      >
        <div className="flex flex-col gap-1">
          <button onClick={() => { onEdit(); onClose(); }} className="flex items-center gap-3 w-full p-4 hover:bg-white/5 rounded-2xl text-left text-white transition-colors">
            <Edit2 className="w-5 h-5 text-zinc-400" />
            <span className="font-medium">Edit Note</span>
          </button>
          
          <button onClick={() => { onPin(); onClose(); }} className="flex items-center gap-3 w-full p-4 hover:bg-white/5 rounded-2xl text-left text-white transition-colors">
            <Pin className={`w-5 h-5 ${isPinned ? 'text-cyan-400' : 'text-zinc-400'}`} />
            <span className="font-medium">{isPinned ? 'Unpin Note' : 'Pin Note'}</span>
          </button>
          
          <button onClick={() => { onDuplicate(); onClose(); }} className="flex items-center gap-3 w-full p-4 hover:bg-white/5 rounded-2xl text-left text-white transition-colors">
            <Copy className="w-5 h-5 text-zinc-400" />
            <span className="font-medium">Duplicate</span>
          </button>
          
          <div className="h-px w-full bg-white/5 my-1" />
          
          <button onClick={() => { onDelete(); onClose(); }} className="flex items-center gap-3 w-full p-4 hover:bg-red-500/10 rounded-2xl text-left text-red-400 transition-colors">
            <Trash2 className="w-5 h-5" />
            <span className="font-medium">Delete</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
