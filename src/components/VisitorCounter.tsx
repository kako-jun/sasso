import { useEffect, useRef } from 'react';
import styles from './VisitorCounter.module.css';

const VISIT_SCRIPT_SRC = 'https://nostalgic.llll-ll.com/components/visit.js';

export function VisitorCounter() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Load the web-component script exactly once. It declares module-level
    // globals (e.g. COUNTER_I18N) and calls customElements.define(), both of
    // which throw "already declared / already defined" if the script is
    // evaluated a second time. Removing the <script> tag does not undo those
    // globals, so we must never append a duplicate (StrictMode double-mount or
    // re-opening the About dialog would otherwise re-evaluate it).
    if (!document.querySelector(`script[src="${VISIT_SCRIPT_SRC}"]`)) {
      const script = document.createElement('script');
      script.src = VISIT_SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }

    // Format counter with commas
    const formatCounter = () => {
      const counter = containerRef.current?.querySelector('nostalgic-counter');
      if (counter?.textContent) {
        const num = counter.textContent.replace(/,/g, '');
        if (/^\d+$/.test(num)) {
          counter.textContent = parseInt(num).toLocaleString();
        }
      }
    };

    // Wait for counter to load and format it
    const timer = setInterval(() => {
      const counter = containerRef.current?.querySelector('nostalgic-counter');
      if (counter?.textContent && counter.textContent !== '0') {
        formatCounter();
        clearInterval(timer);
      }
    }, 100);

    return () => {
      clearInterval(timer);
      // Intentionally keep the script loaded: the custom element registration
      // is global and re-adding the script would re-evaluate it and throw.
    };
  }, []);

  return (
    <div className={styles.visitorCounter} ref={containerRef}>
      Played{' '}
      <nostalgic-counter
        id="sasso-5d582992"
        type="total"
        style={{ fontFamily: 'inherit' }}
      ></nostalgic-counter>{' '}
      times worldwide.
    </div>
  );
}
