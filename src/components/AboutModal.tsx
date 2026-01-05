import { GITHUB_URL } from '../constants';
import styles from './AboutModal.module.css';

declare const __APP_VERSION__: string;

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VERSION = __APP_VERSION__;
const SITE_URL = 'https://llll-ll.com';
const SPONSOR_URL = 'https://github.com/sponsors/kako-jun';

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.aboutModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.aboutTitle}>About</div>
        <div className={styles.aboutName}>Sasso</div>
        <div className={styles.aboutVersion}>Version {VERSION}</div>
        <div className={styles.aboutDescription}>Figuring out the rules is part of the game.</div>
        <div className={styles.aboutAuthor}>
          by <strong>kako-jun</strong>
        </div>
        <div className={styles.aboutLinks}>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href={SITE_URL} target="_blank" rel="noopener noreferrer">
            Homepage
          </a>
        </div>
        <a
          href={SPONSOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.sponsorButton}
        >
          Sponsor
        </a>
        <button className={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
