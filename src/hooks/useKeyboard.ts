import { useEffect } from 'react';

export function useKeyboard(onKey: (key: string) => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        onKey(e.key);
      } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        onKey(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        onKey('=');
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        onKey('C');
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'e' || e.key === 'E') {
        onKey('E');
      } else if (e.key === '.') {
        onKey('.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKey]);
}
