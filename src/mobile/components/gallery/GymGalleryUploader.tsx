import React, { useRef } from 'react';
import { Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export function GymGalleryUploader({ onUpload, isUploading }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        onUpload(file);
      });
    }
    // Reset so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-black/40 backdrop-blur-md border-t border-white/10 z-30">
      <div className="max-w-md mx-auto flex gap-4">
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={cameraRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <input 
          type="file" 
          accept="image/*" 
          multiple
          ref={galleryRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => cameraRef.current?.click()}
          disabled={isUploading}
          className="flex-1 bg-blue-600/80 hover:bg-blue-500/80 active:bg-blue-700/80 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-medium backdrop-blur-sm border border-blue-400/20 disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
          <span>Camera</span>
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => galleryRef.current?.click()}
          disabled={isUploading}
          className="flex-1 bg-white/10 hover:bg-white/15 active:bg-white/5 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-medium backdrop-blur-sm border border-white/10 disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
          <span>Gallery</span>
        </motion.button>
      </div>
    </div>
  );
}
