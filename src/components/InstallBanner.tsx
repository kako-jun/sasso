import { usePWAInstall } from '../hooks';
import styles from './InstallBanner.module.css';

/**
 * "Add to Home Screen" prompt. Catches `beforeinstallprompt`, shows a
 * dismissible banner, and remembers a dismissal in localStorage so it never
 * comes back once the user says no. See usePWAInstall for the visibility
 * rules (browser-eligible, not already installed, not dismissed).
 */
export function InstallBanner() {
  const { canInstall, promptInstall, dismiss } = usePWAInstall();

  if (!canInstall) return null;

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === 'dismissed') {
      dismiss();
    }
  };

  return (
    <div className={styles.installBanner}>
      <img src="/icon-192.png" alt="" width={28} height={28} className={styles.installIcon} />
      <span className={styles.installMessage}>Add Sasso to your home screen</span>
      <div className={styles.installActions}>
        <button type="button" className={styles.installButton} onClick={handleInstall}>
          Install
        </button>
        <button
          type="button"
          className={styles.dismissButton}
          onClick={dismiss}
          aria-label="Dismiss install prompt"
        >
          Later
        </button>
      </div>
    </div>
  );
}
