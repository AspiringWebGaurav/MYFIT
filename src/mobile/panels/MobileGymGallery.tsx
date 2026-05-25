import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/shared/store/useAppStore';
import { useAuthStore } from '@/shared/store/useAuthStore';
import { useGymGalleryPhotos } from '@/shared/hooks/useGymGalleryPhotos';
import { GymGalleryGrid } from '../components/gallery/GymGalleryGrid';
import { GymGalleryViewer } from '../components/gallery/GymGalleryViewer';
import { GymGalleryUploader } from '../components/gallery/GymGalleryUploader';
import { LocalGymPhoto } from '@/shared/types/gymGallery';
import { MobilePageWrapper } from '../components/layout/MobilePageWrapper';

export function MobileGymGallery() {
  const user = useAuthStore(state => state.user);
  
  const {
    photos,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchInitial,
    loadMore,
    uploadPhoto,
    retryUpload,
    cancelUpload,
    deletePhoto,
    updatePhoto
  } = useGymGalleryPhotos(user?.uid);

  const [viewerPhotoIndex, setViewerPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    if (user?.uid) {
      fetchInitial();
    }
  }, [user?.uid, fetchInitial]);

  const handleNavigateViewer = (direction: 'next' | 'prev') => {
    if (viewerPhotoIndex === null) return;
    
    if (direction === 'next' && viewerPhotoIndex < photos.length - 1) {
      setViewerPhotoIndex(viewerPhotoIndex + 1);
    } else if (direction === 'prev' && viewerPhotoIndex > 0) {
      setViewerPhotoIndex(viewerPhotoIndex - 1);
    }
  };

  // Check if there are any active uploads to disable the camera buttons
  const isUploading = photos.some(p => p.operationState === 'processing' || p.operationState === 'uploading' || p.operationState === 'syncing');

  return (
    <>
      <MobilePageWrapper 
        title="Gym Gallery"
        subtitle="Capture your journey"
        className="bg-[#020B1A]"
        contentClassName="relative overflow-hidden"
      >
        <div 
          className="flex-1 h-full overflow-y-auto no-scrollbar relative touch-pan-y overscroll-none pb-32"
          style={{ WebkitOverflowScrolling: 'touch', willChange: 'transform', transform: 'translateZ(0)' }}
        >
          {photos.length === 0 && !isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center mt-[-40px]">
              <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                <Camera className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No photos yet</h2>
              <p className="text-white/50 mb-8 max-w-[250px]">
                Take a picture of your workout or upload from your gallery to start tracking your progress.
              </p>
            </div>
          ) : (
            <GymGalleryGrid 
              photos={photos} 
              isLoading={isLoading}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={loadMore}
              onPhotoClick={(_, idx) => setViewerPhotoIndex(idx)}
              onRetryUpload={retryUpload}
              onCancelUpload={cancelUpload}
            />
          )}
        </div>
      </MobilePageWrapper>

      {/* Fixed Bottom Uploader Actions */}
      <GymGalleryUploader 
        onUpload={uploadPhoto} 
        isUploading={isUploading}
      />

      {/* Fullscreen Viewer Overlay */}
      <AnimatePresence>
        {viewerPhotoIndex !== null && photos[viewerPhotoIndex] && (
          <GymGalleryViewer 
            photo={photos[viewerPhotoIndex]}
            allPhotos={photos}
            currentIndex={viewerPhotoIndex}
            onClose={() => setViewerPhotoIndex(null)}
            onDelete={async (photo) => {
              const success = await deletePhoto(photo);
              if (success) setViewerPhotoIndex(null);
            }}
            onUpdate={updatePhoto}
            onNavigate={(nav) => {
              if (typeof nav === 'number') {
                setViewerPhotoIndex(nav);
              } else {
                handleNavigateViewer(nav);
              }
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
