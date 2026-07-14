// PWA install prompt: dismiss-memory logic.
//
// Split out from the usePWAInstall hook so the "should the banner be shown?"
// decision can be unit-tested without mocking localStorage / matchMedia /
// beforeinstallprompt. Naming follows the {app}-pwa-dismissed convention
// already used by machigai-salad and orber's PwaInstallPrompt.

export const PWA_INSTALL_DISMISS_KEY = 'sasso-pwa-dismissed';

/**
 * Pure decode of the raw localStorage value for the dismiss flag. Isolated
 * so "did the user already dismiss this?" is testable without touching
 * localStorage directly.
 */
export function isInstallDismissed(rawValue: string | null): boolean {
  return rawValue === '1';
}

export interface InstallBannerVisibility {
  hasDeferredPrompt: boolean;
  isStandalone: boolean;
  dismissed: boolean;
}

/**
 * Pure gate: should the install banner be visible right now? Mirrors the
 * conditions in usePWAInstall (browser offered to install, not already
 * running as an installed PWA, user hasn't dismissed it before).
 */
export function shouldShowInstallBanner({
  hasDeferredPrompt,
  isStandalone,
  dismissed,
}: InstallBannerVisibility): boolean {
  return hasDeferredPrompt && !isStandalone && !dismissed;
}
