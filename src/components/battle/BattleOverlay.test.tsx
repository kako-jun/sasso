// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, render, screen, cleanup } from '@testing-library/react';
import { BattleOverlay } from './BattleOverlay';

const NOW = 1_700_000_000_000;
const ROOM_URL = 'https://sasso.example/battle/abc123';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderWaiting(
  overrides: { onExpire?: () => void; onLeave?: () => void; createdAt?: number } = {}
) {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  return render(
    <BattleOverlay
      status="waiting"
      roomUrl={ROOM_URL}
      createdAt={'createdAt' in overrides ? overrides.createdAt : NOW}
      isGameStarted={false}
      onExpire={overrides.onExpire}
      onLeave={overrides.onLeave ?? (() => {})}
    />
  );
}

describe('BattleOverlay waiting timeout/expiry', () => {
  it('before 60s shows the plain waiting state without nudge or expiry', () => {
    renderWaiting();

    expect(screen.getByText('Waiting for opponent...')).toBeTruthy();
    expect(screen.queryByText(/try re-sharing the link/)).toBeNull();
    expect(screen.queryByText('This room has expired.')).toBeNull();
  });

  it('after 60s shows the re-share nudge while keeping url input and Cancel', () => {
    renderWaiting();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText(/try re-sharing the link/)).toBeTruthy();
    expect(screen.getByDisplayValue(ROOM_URL)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.queryByText('This room has expired.')).toBeNull();
  });

  it('after 600s shows expired state and New Room calls onExpire', () => {
    const onExpire = vi.fn();
    renderWaiting({ onExpire });

    act(() => {
      vi.advanceTimersByTime(600_000);
    });

    expect(screen.getByText('This room has expired.')).toBeTruthy();
    expect(screen.queryByDisplayValue(ROOM_URL)).toBeNull();

    const newRoomButton = screen.getByRole('button', { name: 'New Room' });
    act(() => {
      newRoomButton.click();
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('without createdAt stays in plain waiting state even past expiry', () => {
    renderWaiting({ createdAt: undefined });

    act(() => {
      vi.advanceTimersByTime(600_000);
    });

    expect(screen.getByText('Waiting for opponent...')).toBeTruthy();
    expect(screen.queryByText(/try re-sharing the link/)).toBeNull();
    expect(screen.queryByText('This room has expired.')).toBeNull();
  });

  it('Cancel in the expired state calls onLeave (not onExpire)', () => {
    const onExpire = vi.fn();
    const onLeave = vi.fn();
    renderWaiting({ onExpire, onLeave });

    act(() => {
      vi.advanceTimersByTime(600_000);
    });

    expect(screen.getByText('This room has expired.')).toBeTruthy();

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    act(() => {
      cancelButton.click();
    });

    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('hides the QR code once the room has expired', () => {
    renderWaiting();

    expect(document.querySelector('svg')).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(600_000);
    });

    expect(screen.getByText('This room has expired.')).toBeTruthy();
    expect(document.querySelector('svg')).toBeNull();
  });
});
