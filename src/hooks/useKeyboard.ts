import { useEffect } from 'react';

const KEY_MAPPINGS: Record<string, string> = {
  Enter: '=',
  '=': '=',
  Escape: 'C',
  c: 'C',
  C: 'C',
  Backspace: 'E',
  Delete: 'E',
  e: 'E',
  E: 'E',
  '.': '.',
  '+': '+',
  '-': '-',
  '*': '*',
  '/': '/',
};

function mapKey(key: string): string | null {
  // Digit keys
  if (key >= '0' && key <= '9') {
    return key;
  }
  // Mapped keys
  return KEY_MAPPINGS[key] ?? null;
}

export function useKeyboard(onKey: (key: string) => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mappedKey = mapKey(e.key);
      if (mappedKey) {
        onKey(mappedKey);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKey]);
}
