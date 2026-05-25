import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { storage, db } from '../firebase/config';
import { useAuthStore } from '../store/useAuthStore';

// TEST_MODE_ONLY
import { APP_TEST_MODE } from '@/shared/utils/testMode';

export interface DietPlanMetadata {
  fileUrl: string;
  fileName: string;
  uploadedAt: number;
  uploadedBy: string;
  version: number;
  fileSize: number;
  storagePath: string;
  active: boolean;
  previousVersions?: string[];
}

export type DownloadStatus = 'idle' | 'preparing' | 'downloading' | 'slow' | 'success' | 'error' | 'retry';

export interface DownloadState {
  status: DownloadStatus;
  progress: number;
  message: string | null;
  subMessage: string | null;
}

export function useDietVaultStorage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploaded, setIsUploaded] = useState(false);
  
  const [downloadState, setDownloadState] = useState<DownloadState>({
    status: 'idle',
    progress: 0,
    message: null,
    subMessage: null
  });

  const user = useAuthStore(state => state.user);

  const uploadDiet = async (file: File, targetUserId: string) => {
    if (!user) return;
    
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size must be under 10MB');
    }

    setIsUploading(true);
    setUploadProgress(0);
    setIsUploaded(false);

    try {
      const dietPlanRef = doc(db, 'dietPlans', targetUserId);
      const dietPlanSnap = await getDoc(dietPlanRef);
      const currentData = dietPlanSnap.exists() ? dietPlanSnap.data() as DietPlanMetadata : null;
      
      const newVersion = currentData ? currentData.version + 1 : 1;
      const previousVersions = currentData?.previousVersions || [];
      if (currentData?.storagePath) {
        previousVersions.push(currentData.storagePath);
      }

      const storagePath = `diet-vault/${targetUserId}/files/v${newVersion}-diet.pdf`;
      const storageRef = ref(storage, storagePath);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => reject(error),
          () => resolve()
        );
      });

      const fileUrl = await getDownloadURL(storageRef);

      const metadata: DietPlanMetadata = {
        fileUrl,
        fileName: file.name,
        uploadedAt: Date.now(),
        uploadedBy: user.email || 'User',
        version: newVersion,
        fileSize: file.size,
        storagePath,
        active: true,
        previousVersions,
      };

      await setDoc(dietPlanRef, metadata);

      setIsUploading(false);
      setIsUploaded(true);
      setTimeout(() => {
        setIsUploaded(false);
        setUploadProgress(0);
      }, 3000);

    } catch (error) {
      console.error("Upload failed:", error);
      setIsUploading(false);
      setUploadProgress(0);
      throw error;
    }
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const executeDownload = async (storagePath: string, originalFileName: string, attempt = 1, maxAttempts = 3): Promise<boolean> => {
    setDownloadState(prev => ({ ...prev, status: attempt > 1 ? 'retry' : 'preparing', progress: 0, message: null, subMessage: null }));
    
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30s absolute timeout
    let slowTimeoutId: NodeJS.Timeout | null = null;

    try {
      if (!navigator.onLine) {
        throw new Error('offline');
      }

      const fileRef = ref(storage, storagePath);
      let url;
      try {
        url = await getDownloadURL(fileRef);
      } catch (err: any) {
        if (err.code === 'storage/object-not-found') throw new Error('not-found');
        if (err.code === 'storage/unauthorized') throw new Error('unauthorized');
        throw err;
      }

      slowTimeoutId = setTimeout(() => {
        setDownloadState(prev => prev.status === 'downloading' ? { 
          ...prev, 
          status: 'slow', 
          message: 'Slow connection', 
          subMessage: 'Still downloading...' 
        } : prev);
      }, 5000); // Trigger slow warning after 5 seconds

      setDownloadState(prev => ({ ...prev, status: 'downloading' }));

      let response;
      try {
        response = await fetch(url, { signal: abortController.signal });
      } catch (err: any) {
        if (err.name === 'AbortError') throw new Error('timeout');
        // Likely blocked by AdBlocker/Brave Shields
        if (err.message && err.message.includes('Failed to fetch')) {
          throw new Error('blocked');
        }
        throw err;
      }

      if (!response.ok) {
        if (response.status === 404) throw new Error('not-found');
        if (response.status === 403) throw new Error('unauthorized');
        throw new Error('unknown');
      }

      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength || '0', 10);
      let loaded = 0;

      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loaded += value.byteLength;
            if (total > 0) {
              setDownloadState(prev => ({ ...prev, progress: Math.round((loaded / total) * 100) }));
            }
          }
        }
      }

      clearTimeout(slowTimeoutId);
      clearTimeout(timeoutId);

      const blob = reader ? new Blob(chunks as BlobPart[], { type: 'application/pdf' }) : await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = originalFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
      setDownloadState({ status: 'success', progress: 100, message: 'Saved ✓', subMessage: null });
      
      setTimeout(() => {
        setDownloadState({ status: 'idle', progress: 0, message: null, subMessage: null });
      }, 3000);

      return true;

    } catch (error: any) {
      if (slowTimeoutId) clearTimeout(slowTimeoutId);
      clearTimeout(timeoutId);

      let msg = "Something went wrong";
      let sub = null;
      let canRetry = true;

      const errStr = error.message || error.code || String(error);

      if (errStr === 'offline') {
        msg = "No internet connection";
        sub = "Reconnect and try again";
      } else if (errStr === 'blocked') {
        msg = "Download blocked by browser";
        sub = "Disable ad blocker or privacy extension";
        canRetry = false; // Retrying won't bypass the ad blocker
      } else if (errStr === 'not-found') {
        msg = "File unavailable";
        sub = "This diet file no longer exists";
        canRetry = false;
      } else if (errStr === 'unauthorized') {
        msg = "You do not have access";
        canRetry = false;
      } else if (errStr === 'timeout' || errStr.includes('AbortError')) {
        msg = "Request taking too long";
        sub = "Connection timed out";
      }

      if (canRetry && attempt < maxAttempts) {
        setDownloadState({ status: 'error', progress: 0, message: msg, subMessage: `Retrying (${attempt}/${maxAttempts})...` });
        const backoff = Math.pow(2, attempt) * 1000;
        await delay(backoff);
        return executeDownload(storagePath, originalFileName, attempt + 1, maxAttempts);
      }

      setDownloadState({ status: 'error', progress: 0, message: msg, subMessage: sub });
      
      // Auto reset error after 5s
      setTimeout(() => {
        setDownloadState(prev => prev.status === 'error' ? { status: 'idle', progress: 0, message: null, subMessage: null } : prev);
      }, 5000);

      return false;
    }
  };

  const downloadDiet = async (storagePath: string, originalFileName: string) => {
    // Prevent duplicate clicks
    if (downloadState.status !== 'idle' && downloadState.status !== 'error') return;
    await executeDownload(storagePath, originalFileName);
  };

  return {
    uploadDiet,
    downloadDiet,
    isUploading,
    uploadProgress,
    isUploaded,
    downloadState
  };
}
