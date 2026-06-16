// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { SprintRanking } from './SprintRanking';

// jsdom does not implement scrollIntoView; the component calls it to bring the
// highlighted "(you)" row into view, so stub it globally for these tests.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const entries = [
  { rank: 1, name: 'CleverDog711', score: 350, displayScore: '350', createdAt: '2026-01-14' },
  { rank: 2, name: 'SwiftCat42', score: 210, displayScore: '210', createdAt: '2026-01-13' },
  { rank: 3, name: 'BraveFox9', score: 120, displayScore: '120', createdAt: '2026-01-12' },
];

// Ten entries to exercise the limit=10 / MAX_ROWS=10 alignment (every fetched
// row must render, including rank 9–10 which the old 8-row cap dropped).
const tenEntries = Array.from({ length: 10 }, (_, i) => ({
  rank: i + 1,
  name: `Player${i + 1}`,
  score: 1000 - i * 10,
  displayScore: String(1000 - i * 10),
  createdAt: '2026-01-14',
}));

function mockFetchResolving(data: unknown) {
  const fn = vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(data),
    } as Response)
  );
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('SprintRanking', () => {
  it('renders the fetched entries (rank/name/score)', async () => {
    mockFetchResolving({ success: true, data: { entries } });
    render(<SprintRanking playerScore={0} />);

    expect(await screen.findByText('CleverDog711')).toBeTruthy();
    expect(screen.getByText('SwiftCat42')).toBeTruthy();
    expect(screen.getByText('BraveFox9')).toBeTruthy();
    // rank + score for the top row
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getAllByText('350').length).toBeGreaterThan(0);
  });

  it('highlights the row whose score equals playerScore', async () => {
    mockFetchResolving({ success: true, data: { entries } });
    render(<SprintRanking playerScore={210} />);

    const youName = await screen.findByText('SwiftCat42');
    const youRow = youName.closest('li');
    expect(youRow?.getAttribute('data-you')).toBe('true');
    expect(screen.getByText('(you)')).toBeTruthy();

    // A non-matching row must not be highlighted.
    const otherRow = screen.getByText('CleverDog711').closest('li');
    expect(otherRow?.getAttribute('data-you')).toBeNull();
  });

  it('shows a loading state before the fetch resolves', () => {
    // A pending promise keeps the component in its loading state.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {}))
    );
    render(<SprintRanking playerScore={0} />);
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('shows an unavailable state when fetch rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network')))
    );
    render(<SprintRanking playerScore={0} />);
    expect(await screen.findByText('Ranking unavailable')).toBeTruthy();
  });

  it('shows an empty state when data.entries is []', async () => {
    mockFetchResolving({ success: true, data: { entries: [] } });
    render(<SprintRanking playerScore={0} />);
    expect(await screen.findByText('No scores yet')).toBeTruthy();
  });

  it('renders all 10 fetched entries (no 8-row cap) and highlights rank 9', async () => {
    mockFetchResolving({ success: true, data: { entries: tenEntries } });
    // Rank 9's score is 1000 - 8*10 = 920.
    render(<SprintRanking playerScore={920} />);

    // The last fetched row must be rendered, not dropped.
    expect(await screen.findByText('Player10')).toBeTruthy();
    expect(screen.getByText('Player9')).toBeTruthy();

    // The rank-9 row (player's score) is the highlighted one.
    const youRow = screen.getByText('Player9').closest('li');
    expect(youRow?.getAttribute('data-you')).toBe('true');
    expect(screen.getByText('(you)')).toBeTruthy();
  });
});

describe('SprintRanking re-fetch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps existing entries when the delayed re-fetch fails', async () => {
    let call = 0;
    const fn = vi.fn(() => {
      call += 1;
      if (call === 1) {
        return Promise.resolve({ json: () => Promise.resolve({ data: { entries } }) } as Response);
      }
      return Promise.reject(new Error('network'));
    });
    vi.stubGlobal('fetch', fn);

    render(<SprintRanking playerScore={0} />);

    // Flush the initial fetch's promise chain (fetch -> .json -> setState).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.queryByText('CleverDog711')).toBeTruthy();

    // Trigger the 2500ms re-fetch (which rejects), then drain its rejection.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });

    // The list must survive the failed re-fetch.
    expect(screen.queryByText('CleverDog711')).toBeTruthy();
    expect(screen.queryByText('Ranking unavailable')).toBeNull();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
