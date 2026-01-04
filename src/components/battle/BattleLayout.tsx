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

  // Extract game state with defaults for when no state received yet
  const gameState = opponent.gameState ?? {
    display: '0',
    score: 0,
    chains: 0,
    calculationHistory: '',
  };

  if (isDesktop) {
    // Side-by-side layout for desktop
    return (
      <div className="battle-layout-desktop">
        <div className="battle-player-side">{children}</div>
        <div className="battle-opponent-side">
          <OpponentCalculator
            display={gameState.display}
            score={gameState.score}
            chains={gameState.chains}
            calculationHistory={gameState.calculationHistory}
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
        display={gameState.display}
        score={gameState.score}
        chains={gameState.chains}
        calculationHistory={gameState.calculationHistory}
        isConnected={opponent.isConnected}
      />
    </div>
  );
}
