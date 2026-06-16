import { useEffect, useRef, useState } from 'react';
import { BATTLE_EVENTS } from '../utils';
import { BANNER_DISMISS_MS } from '../constants';

/**
 * True for `timeoutMs` after the most recent battle error event, then auto-dismisses.
 * Repeated errors push the dismissal back (debounced hide), so a flapping relay
 * shows one steady indicator rather than spamming.
 */
export function useConnectionError(timeoutMs = BANNER_DISMISS_MS): boolean {
  const [hasError, setHasError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = () => {
      setHasError(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setHasError(false), timeoutMs);
    };
    window.addEventListener(BATTLE_EVENTS.ERROR, handler);
    return () => {
      window.removeEventListener(BATTLE_EVENTS.ERROR, handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeoutMs]);

  return hasError;
}
