import { describe, it, expect } from 'vitest';
import { isInstallDismissed, shouldShowInstallBanner } from './pwaInstall';

describe('isInstallDismissed', () => {
  it('treats the "1" sentinel as dismissed', () => {
    expect(isInstallDismissed('1')).toBe(true);
  });

  it('treats a missing value (never dismissed) as not dismissed', () => {
    expect(isInstallDismissed(null)).toBe(false);
  });

  it('treats any other stored value as not dismissed', () => {
    expect(isInstallDismissed('0')).toBe(false);
    expect(isInstallDismissed('')).toBe(false);
    expect(isInstallDismissed('true')).toBe(false);
  });
});

describe('shouldShowInstallBanner', () => {
  it('shows the banner when the browser offered to install and nothing blocks it', () => {
    expect(
      shouldShowInstallBanner({ hasDeferredPrompt: true, isStandalone: false, dismissed: false })
    ).toBe(true);
  });

  it('hides the banner when the browser has not fired beforeinstallprompt', () => {
    expect(
      shouldShowInstallBanner({ hasDeferredPrompt: false, isStandalone: false, dismissed: false })
    ).toBe(false);
  });

  it('hides the banner when already running installed (standalone)', () => {
    expect(
      shouldShowInstallBanner({ hasDeferredPrompt: true, isStandalone: true, dismissed: false })
    ).toBe(false);
  });

  it('hides the banner once the user dismissed it, even if a prompt is available', () => {
    expect(
      shouldShowInstallBanner({ hasDeferredPrompt: true, isStandalone: false, dismissed: true })
    ).toBe(false);
  });

  it('hides the banner when every condition blocks it at once', () => {
    expect(
      shouldShowInstallBanner({ hasDeferredPrompt: false, isStandalone: true, dismissed: true })
    ).toBe(false);
  });
});
