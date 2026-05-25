import React, { useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocalGymPhoto } from '@/shared/types/gymGallery';
import { Heart, Loader2 } from 'lucide-react';

interface Props {
  photos: LocalGymPhoto[];
  onPhotoClick: (photo: LocalGymPhoto, index: number) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
  onRetryUpload: (id: string) => void;
  onCancelUpload: (id: string) => void;
}

export function GymGalleryGrid({ photos, onPhotoClick, isLoading, hasMore, onLoadMore, isLoadingMore, onRetryUpload, onCancelUpload }: Props) {
  const observer = useRef<IntersectionObserver | null>(null);
  
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        onLoadMore();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, isLoadingMore, hasMore, onLoadMore]);

  if (isLoading && photos.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-[2px] p-1 pb-32">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="aspect-square bg-white/5 animate-pulse rounded-sm" />
        ))}
      </div>
    );
  }

  const total = photos.length;
  const gridColsClass = total <= 2 ? 'grid-cols-1' : total <= 8 ? 'grid-cols-2' : 'grid-cols-3';

  const today = new Date().setHours(0, 0, 0, 0);
  const thisWeek = today - 7 * 24 * 60 * 60 * 1000;

  const grouped = photos.reduce((acc, photo) => {
    const time = photo.uploadedAt;
    if (time >= today) acc.today.push(photo);
    else if (time >= thisWeek) acc.thisWeek.push(photo);
    else acc.older.push(photo);
    return acc;
  }, { today: [] as LocalGymPhoto[], thisWeek: [] as LocalGymPhoto[], older: [] as LocalGymPhoto[] });

  const renderGroup = (title: string, groupPhotos: LocalGymPhoto[]) => {
    if (groupPhotos.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h3 className="text-white/80 font-semibold px-4 mb-2 text-lg">{title}</h3>
        <div className={`grid ${gridColsClass} gap-[2px] px-1`}>
          <AnimatePresence mode="popLayout">
            {groupPhotos.map((photo, index) => {
              const isLast = photo.id === photos[photos.length - 1].id;
              const op = photo.operationState;
              const isUploading = op === 'processing' || op === 'uploading' || op === 'syncing';
              const isError = op === 'error' || op === 'timeout';
              const isDeleting = op === 'deleting';
              const isBusy = op !== 'idle' && op !== undefined;
              
              return (
                <motion.div
                  key={photo.id}
                  ref={isLast ? lastElementRef : null}
                  layoutId={`photo-${photo.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ 
                    opacity: isDeleting ? 0.4 : 1, 
                    scale: isDeleting ? 0.9 : 1,
                    filter: isDeleting ? 'grayscale(100%)' : 'grayscale(0%)'
                  }}
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3 }}
                  onClick={() => !isBusy && onPhotoClick(photo, photos.indexOf(photo))}
                  className={`relative aspect-square cursor-pointer overflow-hidden bg-white/5 transform-gpu rounded-sm ${isBusy ? 'pointer-events-none' : ''}`}
                  whileTap={!isBusy ? { scale: 0.95 } : undefined}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <img
                    src={photo.localUrl || photo.imageUrl}
                    alt={photo.caption || "Gym progress"}
                    loading="lazy"
                    className={`w-full h-full object-cover transition-all duration-500 opacity-0 ${isUploading ? 'blur-sm brightness-50 scale-105' : 'blur-0 brightness-100 scale-100'}`}
                    onLoad={(e) => {
                      (e.target as HTMLImageElement).classList.remove('opacity-0');
                      (e.target as HTMLImageElement).classList.add('opacity-100');
                    }}
                  />
                  
                  {/* Overlay layer for subtle glass border */}
                  <div className="absolute inset-0 border border-white/5 pointer-events-none" />

                  {/* Upload state overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10 pointer-events-auto">
                      <div className="text-white/90 text-sm font-semibold mb-3 drop-shadow-md tracking-wide">
                        {op === 'processing' ? 'Processing...' : op === 'syncing' ? 'Syncing...' : `${photo.progress}%`}
                      </div>
                      {op === 'uploading' && (
                        <div className="relative w-12 h-12">
                          {/* Custom Circular Progress */}
                          <svg className="w-full h-full transform -rotate-90">
                            <circle className="text-white/20" strokeWidth="3" stroke="currentColor" fill="transparent" r="20" cx="24" cy="24" />
                            <circle 
                              className="text-blue-500 transition-all duration-300 ease-out" 
                              strokeWidth="3" 
                              strokeDasharray={20 * 2 * Math.PI} 
                              strokeDashoffset={20 * 2 * Math.PI - ((photo.progress || 0) / 100) * 20 * 2 * Math.PI} 
                              strokeLinecap="round" 
                              stroke="currentColor" 
                              fill="transparent" 
                              r="20" cx="24" cy="24" 
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Error/Timeout state */}
                  {isError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/40 backdrop-blur-md z-20 pointer-events-auto gap-3">
                      <span className="text-red-300 font-semibold text-sm drop-shadow-md px-4 text-center">
                        {op === 'timeout' ? 'Slow connection' : 'Upload failed'}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onRetryUpload(photo.id); }}
                          className="px-4 py-1.5 bg-red-500 hover:bg-red-400 rounded-full text-white text-xs font-semibold transition-colors shadow-lg shadow-red-500/20 active:scale-95"
                        >
                          Retry
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onCancelUpload(photo.id); }}
                          className="px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white text-xs font-medium transition-colors backdrop-blur-md active:scale-95"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Deleting State */}
                  {isDeleting && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
                      <Loader2 className="w-8 h-8 text-white/70 animate-spin" />
                    </div>
                  )}

                  {/* Favorite Badge */}
                  {photo.favorite && !isUploading && !isError && !isDeleting && (
                    <div className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full backdrop-blur-md z-10 shadow-lg border border-white/10">
                      <Heart className="w-3 h-3 text-pink-500 fill-current" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-32 pt-2">
      {renderGroup('Today', grouped.today)}
      {renderGroup('This Week', grouped.thisWeek)}
      {renderGroup('Older', grouped.older)}
      
      {isLoadingMore && (
        <div className="flex justify-center p-6">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
