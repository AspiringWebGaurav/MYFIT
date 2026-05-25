import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/shared/store/useAuthStore';
import { useGymGalleryPhotos } from '@/shared/hooks/useGymGalleryPhotos';
import { LocalGymPhoto } from '@/shared/types/gymGallery';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, ImageIcon, Check } from 'lucide-react';
import { useDesktopShortcuts } from '@/shared/hooks/useDesktopShortcuts';
import { useScreenSize } from '@/shared/hooks/useScreenSize';

export function DesktopGallery() {
  const user = useAuthStore(state => state.user);
  
  const { 
    photos, 
    isLoading,
    fetchInitial,
    uploadPhoto, 
    deletePhoto 
  } = useGymGalleryPhotos(user?.uid);
  
  const [selectedPhoto, setSelectedPhoto] = useState<LocalGymPhoto | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { width } = useScreenSize();

  const isWide = width >= 1600;

  useEffect(() => {
    if (user?.uid) {
      fetchInitial();
    }
  }, [user?.uid, fetchInitial]);

  // Shortcuts
  useDesktopShortcuts([
    {
      combo: { key: 'Escape' },
      handler: () => setSelectedPhoto(null),
    }
  ], [selectedPhoto]);

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await uploadPhoto(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadPhoto(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isUploading = photos.some(p => p.operationState === 'processing' || p.operationState === 'uploading' || p.operationState === 'syncing');
  const uploadProgress = photos.find(p => p.operationState === 'uploading')?.progress || 0;

  return (
    <div 
      className="flex flex-col gap-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className="flex items-start justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-white">Gym Gallery</h2>
          <p className="text-zinc-400 mt-1">Track your visual progress.</p>
        </div>
        <Button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isUploading}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-2xl h-11 px-6 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading {uploadProgress}%
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Photo
            </>
          )}
        </Button>
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
        />
      </header>

      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm border-2 border-dashed border-cyan-500 rounded-3xl flex flex-col items-center justify-center pointer-events-none"
          >
            <Upload className="w-16 h-16 text-cyan-400 mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-white">Drop image here</h3>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`flex flex-1 min-h-0 gap-6 overflow-hidden ${width >= 1920 ? 'max-w-none' : 'max-w-6xl'} mx-auto w-full`}>
        {/* Center Column: Gallery Grid */}
        <Card className={`flex-1 flex flex-col bg-[#0b1620a8] border-cyan-400/10 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl p-6 overflow-y-auto ${width >= 1024 && width < 1440 && selectedPhoto ? 'hidden' : 'block'}`}>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {photos.map(photo => {
                const displayUrl = photo.localUrl || photo.imageUrl;
                return (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSelectedPhoto(photo)}
                  className={`aspect-square rounded-2xl overflow-hidden relative group cursor-pointer border ${
                    selectedPhoto?.id === photo.id ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img 
                    src={displayUrl} 
                    alt="Progress"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {photo.operationState && photo.operationState !== 'idle' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <span className="text-white text-xs font-medium">{new Date(photo.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          
          {photos.length === 0 && !isUploading && !isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No photos yet</h3>
              <p className="text-zinc-500">Upload progress pictures to start tracking.</p>
            </div>
          )}
        </Card>

        {/* Right Column / Modal: Preview */}
        {isWide ? (
          /* Persistent Right Panel for >1600px */
          <AnimatePresence>
            {selectedPhoto && (
              <motion.div 
                initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                animate={{ opacity: 1, width: 400, marginLeft: 24 }}
                exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                className="shrink-0 overflow-hidden"
              >
                <Card className="w-[400px] h-full flex flex-col p-4 bg-[#0b1620a8] border-cyan-400/10 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl relative">
                  <button 
                    onClick={() => setSelectedPhoto(null)}
                    className="absolute top-6 right-6 z-10 w-8 h-8 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex-1 w-full rounded-xl overflow-hidden bg-black/50 flex items-center justify-center relative">
                    <img 
                      src={selectedPhoto.localUrl || selectedPhoto.imageUrl} 
                      alt="Full Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <h4 className="text-lg font-medium text-white">Progress Photo</h4>
                    <p className="text-sm text-zinc-400">Taken on {new Date(selectedPhoto.uploadedAt).toLocaleDateString()}</p>
                    <Button 
                      variant="destructive" 
                      className="mt-4 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      onClick={() => {
                        deletePhoto(selectedPhoto);
                        setSelectedPhoto(null);
                      }}
                    >
                      Delete Photo
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          /* Glass Modal Fallback for <1600px */
          <AnimatePresence>
            {selectedPhoto && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                onClick={() => setSelectedPhoto(null)}
              >
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-[#0b1620] border border-white/10 p-6 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-xl font-medium text-white">Progress Photo</h4>
                      <p className="text-sm text-zinc-400">{new Date(selectedPhoto.uploadedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        onClick={() => {
                          deletePhoto(selectedPhoto);
                          setSelectedPhoto(null);
                        }}
                      >
                        Delete
                      </Button>
                      <button onClick={() => setSelectedPhoto(null)} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 w-full rounded-2xl overflow-hidden bg-black/50 flex items-center justify-center relative min-h-0">
                    <img 
                      src={selectedPhoto.localUrl || selectedPhoto.imageUrl} 
                      alt="Full Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
