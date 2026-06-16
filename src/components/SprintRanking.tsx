import { useEffect, useState } from 'react';
import styles from './SprintRanking.module.css';

const RANKING_ID = 'sasso-5d582992';
const RANKING_URL = `https://api.nostalgic.llll-ll.com/ranking?action=get&id=${RANKING_ID}&limit=10`;
// The score submit fires ~1s after game over; re-fetch once afterwards so the
// player's freshly-submitted score has a chance to appear in the list.
const REFETCH_DELAY_MS = 2500;
const MAX_ROWS = 8;

interface Entry {
  rank: number;
  name: string;
  score: number;
  displayScore?: string;
  createdAt?: string;
}

interface SprintRankingProps {
  playerScore: number;
}

export function SprintRanking({ playerScore }: SprintRankingProps) {
  // null = still loading the very first response.
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async (): Promise<boolean> => {
      try {
        const res = await fetch(RANKING_URL, { signal: controller.signal });
        const json = await res.json();
        if (cancelled) return false;
        const list: Entry[] = json?.data?.entries ?? [];
        setEntries(list);
        setError(false);
        return true;
      } catch {
        if (cancelled) return false;
        // Only surface the error if we have nothing to show yet; a failed
        // re-fetch must not blank an already-rendered list.
        setEntries((prev) => {
          if (prev === null) setError(true);
          return prev;
        });
        return false;
      }
    };

    let refetchTimer: ReturnType<typeof setTimeout> | null = null;
    load().then(() => {
      if (cancelled) return;
      refetchTimer = setTimeout(() => {
        void load();
      }, REFETCH_DELAY_MS);
    });

    return () => {
      cancelled = true;
      controller.abort();
      if (refetchTimer) clearTimeout(refetchTimer);
    };
  }, []);

  let body: React.ReactNode;
  if (entries === null && !error) {
    body = <div className={styles.message}>Loading…</div>;
  } else if (error && (entries === null || entries.length === 0)) {
    body = <div className={styles.message}>Ranking unavailable</div>;
  } else if (entries && entries.length === 0) {
    body = <div className={styles.message}>No scores yet</div>;
  } else {
    let highlighted = false;
    body = (
      <ol className={styles.list}>
        {(entries ?? []).slice(0, MAX_ROWS).map((entry, i) => {
          const isYou = !highlighted && entry.score === playerScore;
          if (isYou) highlighted = true;
          return (
            <li
              key={`${entry.rank}-${i}`}
              className={isYou ? `${styles.row} ${styles.you}` : styles.row}
              data-you={isYou ? 'true' : undefined}
            >
              <span className={styles.rank}>{entry.rank}</span>
              <span className={styles.name}>{entry.name}</span>
              <span className={styles.score}>{entry.displayScore || String(entry.score)}</span>
              {isYou && <span className={styles.youMark}>(you)</span>}
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <div className={styles.sprintRanking}>
      <div className={styles.header}>Ranking</div>
      {body}
    </div>
  );
}
