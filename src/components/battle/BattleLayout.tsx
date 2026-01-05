import type { ReactNode } from 'react';
import styles from './BattleLayout.module.css';

interface BattleLayoutProps {
  children: ReactNode;
  playerHeader?: ReactNode;
  opponentHeader?: ReactNode;
  opponentContent?: ReactNode;
  isDesktop: boolean;
}

/**
 * Responsive battle layout.
 * - Desktop: Side-by-side with player on left, opponent on right
 * - Mobile: Just player content (opponent score shown in bar above)
 */
export function BattleLayout({
  children,
  playerHeader,
  opponentHeader,
  opponentContent,
  isDesktop,
}: BattleLayoutProps) {
  if (isDesktop && opponentContent) {
    // Side-by-side layout for desktop
    return (
      <div className={styles.battleLayoutDesktop}>
        <div className={styles.battlePlayerSide}>
          {playerHeader}
          <div className={styles.sideContent}>{children}</div>
        </div>
        <div className={styles.battleOpponentSide}>
          {opponentHeader}
          <div className={styles.sideContent}>{opponentContent}</div>
        </div>
      </div>
    );
  }

  // Mobile layout or no opponent: just player content
  return <>{children}</>;
}
