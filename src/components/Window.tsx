import type { ReactNode } from 'react';
import styles from './Window.module.css';

interface WindowProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Window({ title, onClose, children }: WindowProps) {
  return (
    <main className={styles.window}>
      <div className={styles.titleBar}>
        <div className={styles.closeBox} onClick={onClose} />
        <span className={styles.title}>{title}</span>
      </div>
      <div className={styles.windowContent}>{children}</div>
    </main>
  );
}
