// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { RoomCreation } from './RoomCreation';

// qr-scanner touches camera/DOM APIs that jsdom lacks; stub it at module load.
// Select-mode rendering does not start the scanner, but the import still runs.
vi.mock('qr-scanner', () => ({
  default: class {
    start = vi.fn().mockResolvedValue(undefined);
    stop = vi.fn();
  },
}));

afterEach(cleanup);

describe('RoomCreation', () => {
  it('shows initialError on the select screen (deep-link join failure)', () => {
    render(
      <RoomCreation
        initialError="Room not found"
        onCreateRoom={() => Promise.resolve('')}
        onJoinRoom={() => Promise.resolve()}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText('Room not found')).toBeTruthy();
  });

  it('renders without an error message when no initialError is given', () => {
    render(
      <RoomCreation
        onCreateRoom={() => Promise.resolve('')}
        onJoinRoom={() => Promise.resolve()}
        onCancel={() => {}}
      />
    );
    expect(screen.queryByText('Room not found')).toBeNull();
  });
});
