import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { X, Heart, Edit2, Download, Share, Trash2 } from 'lucide-react';
import { LocalGymPhoto } from '../../../shared/types/gymGallery';
import { toast } from '../../../shared/store/useToastStore';

interface Props {
  photo: LocalGymPhoto;
  allPhotos: LocalGymPhoto[];
  currentIndex: number;
  onClose: () => void;
  onDelete: (photo: LocalGymPhoto) => void;
  onUpdate: (id: string, updates: Partial<LocalGymPhoto>) => void;
  onNavigate: (direction: 'next' | 'prev' | number) => void;
}

export function GymGalleryViewer({ photo, allPhotos, currentIndex, onClose, onDelete, onUpdate, onNavigate }: Props) {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const controls = useAnimation();
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCaptionText(photo?.caption || '');
    setIsEditingCaption(false);
    setIsConfirmingDelete(false);
  }, [photo?.id]);

  useEffect(() => {
    if (thumbnailStripRef.current) {
      const activeThumb = thumbnailStripRef.current.children[currentIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    if (isEditingCaption || isConfirmingDelete) return; // Disable drag if modal is open

    if (offset.y > 100 || velocity.y > 500) {
      onClose();
    } else if (offset.x > 100 && velocity.x > 200) {
      if (currentIndex > 0) onNavigate('prev');
      else controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    } else if (offset.x < -100 && velocity.x < -200) {
      if (currentIndex < allPhotos.length - 1) onNavigate('next');
      else controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    } else {
      controls.start({ x: 0, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    }
  };

  const handleShare = async () => {
    if (navigator.share && photo) {
      const toastId = toast.loading('Preparing...');
      try {
        await navigator.share({
          title: 'Gym Progress',
          text: photo.caption || 'Check out my gym progress!',
          url: photo.imageUrl,
        });
        toast.dismiss(toastId);
        toast.success('Shared ✓');
      } catch (err: any) {
        toast.dismiss(toastId);
        if (err.name !== 'AbortError') {
          toast.error('Share failed');
        }
      }
    } else {
      toast.error('Sharing not supported on this device');
    }
  };

  const handleDownload = async () => {
    if (!photo) return;
    const toastId = toast.loading('Saving...');
    try {
      const response = await fetch(photo.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gym-photo-${photo.id}.webp`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.dismiss(toastId);
      toast.success('Saved to device ✓');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Failed to save image');
    }
  };

  const saveCaption = () => {
    setIsEditingCaption(false);
    if (photo && captionText !== photo.caption) {
      onUpdate(photo.id, { caption: captionText });
    }
  };

  if (!photo) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999] bg-black flex flex-col"
      style={{ touchAction: 'none' }}
    >
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-12 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md active:bg-white/20 transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="text-white/80 font-medium tracking-wide">
          {new Date(photo.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        <button 
          onClick={() => setIsConfirmingDelete(true)} 
          className="p-2 bg-red-500/20 text-red-400 rounded-full backdrop-blur-md active:bg-red-500/40 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence initial={false} custom={currentIndex}>
          <motion.div
            key={photo.id}
            custom={currentIndex}
            className="absolute inset-0 flex items-center justify-center touch-none"
            drag={!isEditingCaption && !isConfirmingDelete}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.8}
            onDragEnd={handleDragEnd}
            animate={controls}
            onDoubleClick={(e) => {
              if (isEditingCaption || isConfirmingDelete) return;
              const isZoomed = e.currentTarget.style.transform.includes('scale(2)');
              e.currentTarget.style.transform = isZoomed ? 'scale(1)' : 'scale(2)';
              e.currentTarget.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
            }}
          >
            <motion.img
              layoutId={`photo-${photo.id}`}
              src={photo.localUrl || photo.imageUrl}
              alt="Gym progress"
              className="max-w-full max-h-full object-contain pointer-events-none"
              style={{ willChange: 'transform' }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isConfirmingDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#020B1A]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2 text-center">Delete photo?</h3>
              <p className="text-white/60 text-center mb-8">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsConfirmingDelete(false)}
                  className="flex-1 py-3.5 bg-white/10 hover:bg-white/15 active:bg-white/5 rounded-2xl text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setIsConfirmingDelete(false);
                    onDelete(photo);
                  }}
                  className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 active:bg-red-700 rounded-2xl text-white font-medium transition-colors shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename Modal */}
      <AnimatePresence>
        {isEditingCaption && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 pb-12"
          >
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-md bg-[#020B1A]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl"
            >
              <h3 className="text-white font-medium mb-4 px-2">Edit caption</h3>
              <input
                autoFocus
                type="text"
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveCaption()}
                className="w-full bg-black/50 text-white px-5 py-4 rounded-2xl border border-white/10 outline-none focus:border-blue-500/50 transition-colors mb-6"
                placeholder="Add a caption..."
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditingCaption(false)}
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 active:bg-white/5 rounded-2xl text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveCaption}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-2xl text-white font-medium transition-colors shadow-lg shadow-blue-500/20"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Interface */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10 pb-8 pt-16 pointer-events-none">
        
        {/* Caption Area */}
        <div className="flex items-center gap-3 px-6 mb-6 pointer-events-auto">
          <div className="flex-1 text-white text-[17px] tracking-wide font-medium drop-shadow-md">
            {photo.caption || <span className="text-white/40 font-normal italic">No caption</span>}
          </div>
          <button 
            onClick={() => setIsEditingCaption(true)} 
            className="p-3 bg-white/10 text-white rounded-full backdrop-blur-md active:bg-white/20 transition-colors shadow-lg"
          >
            <Edit2 className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Thumbnail Strip */}
        {allPhotos.length > 1 && (
          <div 
            ref={thumbnailStripRef}
            className="flex gap-[6px] overflow-x-auto no-scrollbar px-6 mb-8 snap-x snap-mandatory pointer-events-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {allPhotos.map((p, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={p.id}
                  onClick={() => onNavigate(index)}
                  className={`relative shrink-0 h-[52px] w-[52px] rounded-[4px] overflow-hidden transition-all duration-300 snap-center ${
                    isActive ? 'ring-[2.5px] ring-white scale-[1.15] z-10 mx-1' : 'opacity-40 hover:opacity-100 scale-95'
                  }`}
                >
                  <img src={p.localUrl || p.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              );
            })}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex justify-around items-center px-8 pointer-events-auto">
          <motion.button 
            whileTap={{ scale: 0.8 }}
            onClick={() => onUpdate(photo.id, { favorite: !photo.favorite })}
            className={`p-4 rounded-full backdrop-blur-xl transition-all duration-300 shadow-lg ${photo.favorite ? 'bg-pink-500/20 text-pink-500 ring-1 ring-pink-500/50' : 'bg-white/10 text-white active:bg-white/20'}`}
          >
            <Heart className={`w-[22px] h-[22px] ${photo.favorite ? 'fill-current scale-110' : ''} transition-transform`} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleDownload} className="p-4 bg-white/10 rounded-full text-white backdrop-blur-xl active:bg-white/20 transition-colors shadow-lg">
            <Download className="w-[22px] h-[22px]" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleShare} className="p-4 bg-white/10 rounded-full text-white backdrop-blur-xl active:bg-white/20 transition-colors shadow-lg">
            <Share className="w-[22px] h-[22px]" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
