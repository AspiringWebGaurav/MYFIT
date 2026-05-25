import { useEffect } from 'react';

type KeyCombo = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
};

type ShortcutHandler = (e: KeyboardEvent) => void;

export function useDesktopShortcuts(shortcuts: { combo: KeyCombo; handler: ShortcutHandler }[], deps: any[] = []) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea, UNLESS the shortcut is explicitly Esc
      if (
        (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) &&
        e.key !== 'Escape'
      ) {
        return;
      }

      for (const { combo, handler } of shortcuts) {
        const keyMatch = e.key.toLowerCase() === combo.key.toLowerCase();
        const ctrlMatch = !!combo.ctrlKey === (e.ctrlKey || e.metaKey);
        const shiftMatch = !!combo.shiftKey === e.shiftKey;
        const altMatch = !!combo.altKey === e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          handler(e);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
