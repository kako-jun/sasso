import { useState, useEffect } from 'react';

/**
 * Hook that returns true if the viewport matches the given media query.
 * @param query CSS media query string (e.g., '(min-width: 768px)')
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Modern browsers
    mediaQuery.addEventListener('change', handler);
    // Set initial value
    setMatches(mediaQuery.matches);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Hook that returns true if the viewport is desktop-sized (>= 768px).
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)');
}
