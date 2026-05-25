import React, { useRef, useState } from 'react';
import { motion, useAnimation, useMotionValue, PanInfo } from 'framer-motion';
import { Pin, Trash2 } from 'lucide-react';
import { NoteMetadata } from '@/shared/store/useTrainingJournalStore';

interface NoteCardProps {
  meta: NoteMetadata;
  onClick: () => void;
  onPin: () => void;
  onDelete: () => void;
  onLongPress: () => void;
}

export function NoteCard({ meta, onClick, onPin, onDelete, onLongPress }: NoteCardProps) {
  const controls = useAnimation();
  const x = useMotionValue(0);
  const [isSwiping, setIsSwiping] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    if (isSwiping) return;
    timeoutRef.current = setTimeout(() => {
      onLongPress();
      timeoutRef.current = null;
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  
  const handleTouchMove = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleDragEnd = async (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -100 || velocity < -500) {
      // Swipe left -> Delete
      await controls.start({ x: -1000, opacity: 0, transition: { duration: 0.2 } });
      onDelete();
    } else if (offset > 100 || velocity > 500) {
      // Swipe right -> Pin
      await controls.start({ x: 1000, opacity: 0, transition: { duration: 0.2 } });
      onPin();
      // Snap back immediately for next render
      controls.start({ x: 0, opacity: 1, transition: { duration: 0 } });
    } else {
      // Snap back
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
    
    setTimeout(() => setIsSwiping(false), 50);
  };

  return (
    <div className="relative w-full mb-3 touch-pan-y">
      {/* Background actions revealed on swipe */}
      <div className="absolute inset-0 flex justify-between items-center px-6 rounded-2xl bg-zinc-900/50 overflow-hidden">
        <div className="text-cyan-400 font-medium text-sm flex items-center gap-2">
          <Pin className="w-4 h-4" /> Pin
        </div>
        <div className="text-red-400 font-medium text-sm flex items-center gap-2">
          Delete
        </div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragStart={() => setIsSwiping(true)}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onClick={() => {
          if (!isSwiping) onClick();
        }}
        className="relative bg-white/[0.03] border border-white/5 rounded-2xl p-4 backdrop-blur-md active:scale-[0.98] transition-transform"
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-zinc-100 font-medium text-base truncate flex items-center gap-2">
              {meta.isPinned && <Pin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />}
              {meta.previewTitle}
            </h4>
            <p className="text-zinc-500 text-sm mt-1 line-clamp-2 leading-relaxed">
              {meta.previewSnippet || "No additional text"}
            </p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 -mr-2 -mt-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 text-[11px] font-medium text-zinc-600">
          Last edited {new Date(meta.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </motion.div>
    </div>
  );
}
