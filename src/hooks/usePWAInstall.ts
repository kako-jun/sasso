import { useState, useEffect, useCallback } from 'react';
import { PWA_INSTALL_DISMISS_KEY, isInstallDismissed, shouldShowInstallBanner } from '../utils';

/**
 * BeforeInstallPromptEvent - Browser event for PWA installation.
 * Not (yet) part of the DOM lib types, so it's declared locally.
 */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface UsePWAInstallReturn {
  canInstall: boolean;
  promptInstall: () => Promise<'accepted' | 'dismissed' | null>;
  dismiss: () => void;
}

function readDismissed(): boolean {
  try {
    return isInstallDismissed(localStorage.getItem(PWA_INSTALL_DISMISS_KEY));
  } catch {
    // Private browsing / storage disabled - fall back to "not dismissed" so
    // the banner can still be shown (it just won't remember a dismissal).
    return false;
  }
}

function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    setIsStandalone(isStandaloneDisplay());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | null> => {
    if (!deferredPrompt) return null;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      return outcome;
    } catch {
      return null;
    } finally {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(PWA_INSTALL_DISMISS_KEY, '1');
    } catch {
      // Private browsing / storage disabled - the banner just won't
      // remember the dismissal across reloads.
    }
  }, []);

  const canInstall = shouldShowInstallBanner({
    hasDeferredPrompt: !!deferredPrompt,
    isStandalone,
    dismissed,
  });

  return { canInstall, promptInstall, dismiss };
}
