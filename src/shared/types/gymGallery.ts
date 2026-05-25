export interface GymPhoto {
  id: string;
  imageUrl: string;
  storagePath: string;
  uploadedAt: number; // Unix timestamp
  size: number; // bytes
  favorite: boolean;
  caption?: string;
  width?: number; // Optional but good for masonry layouts
  height?: number; // Optional but good for masonry layouts
}

export type OperationState = 'idle' | 'processing' | 'uploading' | 'syncing' | 'deleting' | 'renaming' | 'sharing' | 'error' | 'timeout';

export interface LocalGymPhoto extends GymPhoto {
  localUrl?: string;
  operationState?: OperationState;
  progress?: number;
}
