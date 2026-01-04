import type { ReactNode } from 'react';
import type { OpponentState } from '../../types/battle';
import { OpponentScore } from './OpponentScore';
import { OpponentCalculator } from './OpponentCalculator';

interface BattleLayoutProps {
  children: ReactNode;
  opponent: OpponentState | null;
  isDesktop: boolean;
}

/**
 * Responsive battle layout.
 * - Desktop: Side-by-side calculators
 * - Mobile: Stacked with compact opponent score
 */
export function BattleLayout({ children, opponent, isDesktop }: BattleLayoutProps) {
  if (!opponent) {
    return <>{children}</>;
  }

  if (isDesktop) {
    // Side-by-side layout for desktop
    return (
      <div className="battle-layout-desktop">
        <div className="battle-player-side">{children}</div>
        <div className="battle-opponent-side">
          <OpponentCalculator
            display={opponent.display}
            score={opponent.score}
            chains={opponent.chains}
            calculationHistory={opponent.calculationHistory}
            isConnected={opponent.isConnected}
          />
        </div>
      </div>
    );
  }

  // Mobile layout: opponent score below player's score area
  return (
    <div className="battle-layout-mobile">
      {children}
      <OpponentScore
        display={opponent.display}
        score={opponent.score}
        chains={opponent.chains}
        calculationHistory={opponent.calculationHistory}
        isConnected={opponent.isConnected}
      />
    </div>
  );
}
