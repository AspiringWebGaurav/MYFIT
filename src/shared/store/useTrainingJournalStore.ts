import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as idb from 'idb-keyval';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthStore } from './useAuthStore';

export type SyncStatus = 'synced' | 'saving' | 'syncing' | 'offline' | 'error';

export interface TrainingNote {
  id: string;
  title?: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  lastSyncedAt: number;
  isDraft: boolean;
  isPinned?: boolean;
}

export interface NoteMetadata {
  id: string;
  previewTitle: string;
  previewSnippet: string;
  updatedAt: number;
  lastSyncedAt: number;
  isPinned: boolean;
}

interface TrainingJournalState {
  activeNoteId: string | null;
  noteMetadataList: NoteMetadata[];
  syncStatus: SyncStatus;
  conflictState: boolean;
  
  setActiveNoteId: (id: string | null) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setConflictState: (conflict: boolean) => void;
  
  // Actions
  loadNote: (noteId: string) => Promise<TrainingNote | null>;
  saveNoteLocal: (note: TrainingNote) => Promise<void>;
  syncNoteToFirebase: (note: TrainingNote) => Promise<void>;
  createNote: (initialContent?: string) => Promise<string>;
  deleteNote: (noteId: string) => Promise<void>;
  duplicateNote: (noteId: string) => Promise<string | null>;
  togglePin: (noteId: string) => Promise<void>;
  
  // Helpers
  generatePreview: (content: string, title?: string) => { previewTitle: string, previewSnippet: string };
}

export const useTrainingJournalStore = create<TrainingJournalState>()(
  persist(
    (set, get) => ({
      activeNoteId: null,
      noteMetadataList: [],
      syncStatus: 'synced',
      conflictState: false,
      
      setActiveNoteId: (id) => set({ activeNoteId: id }),
      setSyncStatus: (status) => set({ syncStatus: status }),
      setConflictState: (conflict) => set({ conflictState: conflict }),
      
      generatePreview: (content: string, title?: string) => {
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let previewTitle = "Untitled Note";
        let previewSnippet = "";
        
        if (title && title.trim().length > 0) {
          previewTitle = title;
          if (lines.length > 0) {
            previewSnippet = lines.join(' ');
            if (previewSnippet.length > 60) previewSnippet = previewSnippet.substring(0, 60) + '...';
          }
        } else {
          if (lines.length > 0) {
            previewTitle = lines[0].length > 40 ? lines[0].substring(0, 40) + '...' : lines[0];
            if (lines.length > 1) {
              previewSnippet = lines.slice(1).join(' ');
              if (previewSnippet.length > 60) previewSnippet = previewSnippet.substring(0, 60) + '...';
            }
          }
        }
        
        return { previewTitle, previewSnippet };
      },
      
      loadNote: async (noteId: string) => {
        try {
          const localNote = await idb.get<TrainingNote>(`journal_note_${noteId}`);
          return localNote || null;
        } catch (error) {
          console.error("Error loading note from IndexedDB", error);
          return null;
        }
      },
      
      saveNoteLocal: async (note: TrainingNote) => {
        try {
          await idb.set(`journal_note_${note.id}`, note);
          
          const { previewTitle, previewSnippet } = get().generatePreview(note.content, note.title);
          
          set((state) => {
            const existingIndex = state.noteMetadataList.findIndex(n => n.id === note.id);
            const newMeta: NoteMetadata = {
              id: note.id,
              previewTitle,
              previewSnippet,
              updatedAt: note.updatedAt,
              lastSyncedAt: note.lastSyncedAt,
              isPinned: note.isPinned || false
            };
            
            const newList = [...state.noteMetadataList];
            if (existingIndex >= 0) {
              newList[existingIndex] = newMeta;
            } else {
              newList.push(newMeta);
            }
            
            // Sort: pinned first, then by updatedAt descending
            newList.sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return b.updatedAt - a.updatedAt;
            });
            
            return { noteMetadataList: newList };
          });
          
        } catch (error) {
          console.error("Error saving note to IndexedDB", error);
        }
      },
      
      syncNoteToFirebase: async (note: TrainingNote) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        
        try {
          set({ syncStatus: 'syncing' });
          const docRef = doc(db, 'users', user.uid, 'journal', note.id);
          
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const remoteData = docSnap.data();
            if (remoteData.updatedAt > note.lastSyncedAt && remoteData.content !== note.content) {
              set({ conflictState: true, syncStatus: 'error' });
              return;
            }
          }
          
          const now = Date.now();
          const syncData = {
            id: note.id,
            title: note.title || null,
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            lastSyncedAt: now,
            isDraft: false,
            isPinned: note.isPinned || false
          };
          
          await setDoc(docRef, syncData, { merge: true });
          
          const updatedNote = { ...note, lastSyncedAt: now, isDraft: false };
          await idb.set(`journal_note_${note.id}`, updatedNote);
          
          set((state) => {
             const newList = state.noteMetadataList.map(m => 
               m.id === note.id ? { ...m, lastSyncedAt: now } : m
             );
             return { noteMetadataList: newList, syncStatus: 'synced', conflictState: false };
          });
          
        } catch (error) {
          console.error("Error syncing to Firebase", error);
          set({ syncStatus: 'error' });
          throw error;
        }
      },
      
      createNote: async (initialContent = '') => {
        const id = crypto.randomUUID();
        const now = Date.now();
        const newNote: TrainingNote = {
          id,
          content: initialContent,
          createdAt: now,
          updatedAt: now,
          lastSyncedAt: 0,
          isDraft: true,
          isPinned: false
        };
        
        await get().saveNoteLocal(newNote);
        get().syncNoteToFirebase(newNote).catch(() => {}); // trigger background sync
        
        return id;
      },
      
      deleteNote: async (noteId: string) => {
        try {
          await idb.del(`journal_note_${noteId}`);
          set((state) => ({
            noteMetadataList: state.noteMetadataList.filter(n => n.id !== noteId),
            activeNoteId: state.activeNoteId === noteId ? null : state.activeNoteId
          }));
          
          const user = useAuthStore.getState().user;
          if (user) {
            const docRef = doc(db, 'users', user.uid, 'journal', noteId);
            await deleteDoc(docRef);
          }
        } catch (error) {
          console.error("Error deleting note", error);
        }
      },
      
      duplicateNote: async (noteId: string) => {
        const note = await get().loadNote(noteId);
        if (!note) return null;
        
        const newId = await get().createNote(note.content);
        return newId;
      },
      
      togglePin: async (noteId: string) => {
        const note = await get().loadNote(noteId);
        if (!note) return;
        
        const updatedNote = { ...note, isPinned: !note.isPinned, updatedAt: Date.now(), isDraft: true };
        await get().saveNoteLocal(updatedNote);
        get().syncNoteToFirebase(updatedNote).catch(() => {});
      }
    }),
    {
      name: 'myfit-training-journal-meta',
      partialize: (state) => ({ 
        noteMetadataList: state.noteMetadataList,
        activeNoteId: state.activeNoteId,
        syncStatus: (state.syncStatus === 'saving' || state.syncStatus === 'syncing') ? 'offline' : state.syncStatus
      }),
    }
  )
);
