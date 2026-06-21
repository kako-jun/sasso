// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { GameOverOverlay } from './GameOverlay';
import type { GameOverReason } from '../types';

afterEach(cleanup);

describe('GameOverOverlay', () => {
  // Banner view (non-sprint) so the assertions never depend on SprintRanking's
  // network fetch — they only exercise the reason → label mapping.
  const cases: Array<{ reason: GameOverReason; title: string; hint: string }> = [
    { reason: 'overflow', title: 'GAME OVER', hint: 'overflow' },
    { reason: 'timeup', title: 'GAME OVER', hint: 'time up' },
    { reason: 'surrender', title: 'SURRENDER', hint: 'C or E' },
    { reason: 'misinput', title: 'SURRENDER', hint: 'digit after =' },
  ];

  it.each(cases)('shows "$title" + hint "$hint" for $reason', ({ reason, title, hint }) => {
    render(<GameOverOverlay reason={reason} onRetry={vi.fn()} gameMode="endless" score={0} />);
    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByText(hint)).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
  });

  it('shows the SURRENDER banner (not the ranking) when a Sprint run ends in misinput', () => {
    render(<GameOverOverlay reason="misinput" onRetry={vi.fn()} gameMode="sprint" score={500} />);
    expect(screen.getByText('SURRENDER')).toBeTruthy();
    expect(screen.getByText('digit after =')).toBeTruthy();
    // Ranking view leads with "Your score:"; the surrender path must not.
    expect(screen.queryByText(/Your score/)).toBeNull();
  });

  it('falls back to GAME OVER with no hint when reason is null', () => {
    render(<GameOverOverlay reason={null} onRetry={vi.fn()} gameMode="practice" score={0} />);
    expect(screen.getByText('GAME OVER')).toBeTruthy();
  });
});
