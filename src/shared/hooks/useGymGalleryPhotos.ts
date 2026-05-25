import { useState, useCallback, useRef, useEffect } from 'react';
import { db, storage } from '../firebase/config';
import {
  collection, doc, setDoc, updateDoc, deleteDoc,
  query, orderBy, limit, getDocs, startAfter, QueryDocumentSnapshot
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { GymPhoto, LocalGymPhoto, OperationState } from '../types/gymGallery';
import { processGalleryImage } from '../utils/imageProcessing';
import { toast } from '../store/useToastStore';

const BATCH_SIZE = 24;
const UPLOAD_TIMEOUT_MS = 15000; // 15 seconds without progress = timeout

export function useGymGalleryPhotos(userId: string | undefined) {
  const [photos, setPhotos] = useState<LocalGymPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);
  const hasCleanedUpRef = useRef(false);

  const collectionPath = userId ? `users/${userId}/gymGalleryV2` : '';

  // Cancel tokens for uploads
  const uploadTasksRef = useRef<Map<string, any>>(new Map());
  const uploadFilesRef = useRef<Map<string, File>>(new Map());

  const cleanupOldGallery = useCallback(async () => {
    if (!userId || hasCleanedUpRef.current) return;
    try {
      hasCleanedUpRef.current = true;
      const oldColRef = collection(db, 'users', userId, 'gymGallery');
      const oldSnap = await getDocs(oldColRef);
      if (oldSnap.empty) return;
      
      const deletePromises = oldSnap.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        if (data.storagePath) {
          try {
            const storageRef = ref(storage, data.storagePath);
            await deleteObject(storageRef);
          } catch (e) {}
        }
        await deleteDoc(docSnapshot.ref);
      });
      await Promise.allSettled(deletePromises);
    } catch (e) { }
  }, [userId]);

  const fetchInitial = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    await cleanupOldGallery();

    try {
      const q = query(collection(db, collectionPath), orderBy('uploadedAt', 'desc'), limit(BATCH_SIZE));
      const snap = await getDocs(q);
      
      const loadedPhotos: LocalGymPhoto[] = [];
      snap.forEach(document => loadedPhotos.push({ ...document.data() as GymPhoto, operationState: 'idle' }));
      
      setPhotos(loadedPhotos);
      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
      setHasMore(snap.docs.length === BATCH_SIZE);
    } catch (error) {
      toast.error('Failed to load gallery');
    } finally {
      setIsLoading(false);
    }
  }, [userId, collectionPath, cleanupOldGallery]);

  const loadMore = useCallback(async () => {
    if (!userId || !hasMore || isLoadingMore || !lastDocRef.current) return;
    setIsLoadingMore(true);
    try {
      const q = query(collection(db, collectionPath), orderBy('uploadedAt', 'desc'), startAfter(lastDocRef.current), limit(BATCH_SIZE));
      const snap = await getDocs(q);
      
      const loadedPhotos: LocalGymPhoto[] = [];
      snap.forEach(document => loadedPhotos.push({ ...document.data() as GymPhoto, operationState: 'idle' }));
      
      setPhotos(prev => [...prev, ...loadedPhotos]);
      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
      setHasMore(snap.docs.length === BATCH_SIZE);
    } catch (error) {
      toast.error('Failed to load more photos');
    } finally {
      setIsLoadingMore(false);
    }
  }, [userId, hasMore, isLoadingMore, collectionPath]);

  const setPhotoState = useCallback((id: string, updates: Partial<LocalGymPhoto>) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const performUpload = useCallback(async (file: File, photoId: string, localUrl: string, optimisticPhoto: LocalGymPhoto) => {
    try {
      setPhotos(prev => {
        if (!prev.find(p => p.id === photoId)) return [optimisticPhoto, ...prev];
        return prev.map(p => p.id === photoId ? { ...p, operationState: 'processing', progress: 0 } : p);
      });
      
      const processed = await processGalleryImage(file, { convertToWebp: true });
      setPhotoState(photoId, { operationState: 'uploading', width: processed.width, height: processed.height });

      const storagePath = `gym-gallery-v2/${userId}/${photoId}.webp`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, processed.blob);
      uploadTasksRef.current.set(photoId, uploadTask);

      let lastProgressTime = Date.now();
      let timeoutInterval = setInterval(() => {
        if (Date.now() - lastProgressTime > UPLOAD_TIMEOUT_MS) {
          uploadTask.cancel();
          setPhotoState(photoId, { operationState: 'timeout' });
          toast.error('Upload timed out due to slow connection');
          clearInterval(timeoutInterval);
        }
      }, 5000);

      uploadTask.on('state_changed', 
        (snapshot) => {
          lastProgressTime = Date.now();
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setPhotoState(photoId, { progress: Math.round(progress) });
        },
        (error) => {
          clearInterval(timeoutInterval);
          if (error.code === 'storage/canceled') {
            setPhotoState(photoId, { operationState: 'error' });
            toast.info('Upload cancelled');
          } else {
            setPhotoState(photoId, { operationState: 'error' });
            toast.error('Upload failed');
          }
        },
        async () => {
          clearInterval(timeoutInterval);
          setPhotoState(photoId, { operationState: 'syncing' });
          
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            const newPhoto: GymPhoto = {
              id: photoId,
              imageUrl: downloadUrl,
              storagePath,
              favorite: false,
              uploadedAt: optimisticPhoto.uploadedAt,
              size: processed.blob.size,
              width: processed.width,
              height: processed.height,
              caption: ''
            };

            await setDoc(doc(db, collectionPath, photoId), newPhoto);
            toast.success('Uploaded ✓');
            
            // Revert back to plain LocalGymPhoto without localUrl to enforce cache usage, but keep it briefly to prevent flicker
            setPhotoState(photoId, { ...newPhoto, operationState: 'idle' });
            
            uploadFilesRef.current.delete(photoId);
            uploadTasksRef.current.delete(photoId);
            setTimeout(() => URL.revokeObjectURL(localUrl), 1000);
          } catch (syncError) {
            setPhotoState(photoId, { operationState: 'error' });
            toast.error('Failed to sync photo to database');
          }
        }
      );
    } catch (error) {
      setPhotoState(photoId, { operationState: 'error' });
      toast.error('Processing failed');
    }
  }, [userId, collectionPath, setPhotoState]);

  const uploadPhoto = useCallback(async (file: File) => {
    if (!userId) return;
    const localUrl = URL.createObjectURL(file);
    const autoId = doc(collection(db, collectionPath)).id;
    
    uploadFilesRef.current.set(autoId, file);
    const optimisticPhoto: LocalGymPhoto = {
      id: autoId,
      imageUrl: localUrl,
      localUrl,
      storagePath: '',
      favorite: false,
      uploadedAt: Date.now(),
      size: file.size,
      operationState: 'processing',
      progress: 0,
      caption: ''
    };

    performUpload(file, autoId, localUrl, optimisticPhoto);
  }, [userId, collectionPath, performUpload]);

  const retryUpload = useCallback((photoId: string) => {
    const file = uploadFilesRef.current.get(photoId);
    const existingPhoto = photos.find(p => p.id === photoId);
    if (!file || !existingPhoto) return;
    const toastId = toast.loading('Retrying...');
    setTimeout(() => toast.dismiss(toastId), 1000); 
    performUpload(file, photoId, existingPhoto.localUrl || existingPhoto.imageUrl, existingPhoto);
  }, [photos, performUpload]);

  const cancelUpload = useCallback((photoId: string) => {
    const task = uploadTasksRef.current.get(photoId);
    if (task) {
      task.cancel();
    }
    // Remove from UI immediately
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    uploadFilesRef.current.delete(photoId);
    uploadTasksRef.current.delete(photoId);
  }, []);

  const deletePhoto = useCallback(async (photo: LocalGymPhoto) => {
    if (!userId || photo.operationState !== 'idle') return false;
    
    // Operation Lock
    setPhotoState(photo.id, { operationState: 'deleting' });
    const toastId = toast.loading('Deleting...');

    try {
      const storageRef = ref(storage, photo.storagePath);
      await deleteObject(storageRef).catch(e => {
        if (e.code !== 'storage/object-not-found') throw e;
      });
      await deleteDoc(doc(db, collectionPath, photo.id));
      
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      toast.dismiss(toastId);
      toast.success('Deleted ✓');
      
      // Memory cleanup
      if (photo.localUrl) {
        URL.revokeObjectURL(photo.localUrl);
      }
      uploadFilesRef.current.delete(photo.id);
      uploadTasksRef.current.delete(photo.id);
      
      return true;
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Delete failed');
      // Rollback
      setPhotoState(photo.id, { operationState: 'idle' });
      return false;
    }
  }, [userId, collectionPath, setPhotoState]);

  const updatePhoto = useCallback(async (photoId: string, updates: Partial<GymPhoto>) => {
    if (!userId) return;
    
    const photoToUpdate = photos.find(p => p.id === photoId);
    if (!photoToUpdate || (photoToUpdate.operationState !== 'idle' && photoToUpdate.operationState !== undefined)) return;
    
    const previousState = { ...photoToUpdate };
    
    // Optimistic Update & Lock
    const opState = 'caption' in updates ? 'renaming' : 'idle'; // Only lock for renaming, favorite can be quick
    setPhotoState(photoId, { ...updates, operationState: opState });

    try {
      await updateDoc(doc(db, collectionPath, photoId), updates);
      if (opState === 'renaming') toast.success('Saved ✓');
      if ('favorite' in updates && updates.favorite) toast.success('Saved ❤️');
      setPhotoState(photoId, { operationState: 'idle' });
    } catch (error) {
      toast.error('Update failed');
      // Rollback
      setPhotoState(photoId, { ...previousState, operationState: 'idle' });
    }
  }, [userId, collectionPath, photos, setPhotoState]);

  return {
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
  };
}
