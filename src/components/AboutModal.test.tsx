// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { AboutModal } from './AboutModal';
import { HOW_TO_PLAY_URL } from '../constants';

afterEach(cleanup);

describe('AboutModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<AboutModal isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('exposes a How to Play link pointing at the README rules', () => {
    render(<AboutModal isOpen onClose={() => {}} />);
    const link = screen.getByRole('link', { name: 'How to Play' });
    expect(link.getAttribute('href')).toBe(HOW_TO_PLAY_URL);
    expect(HOW_TO_PLAY_URL).toMatch(/#how-to-play$/);
    // Opens the manual in a new tab without leaking the opener
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel') ?? '').toContain('noopener');
  });

  it('keeps the "figuring out the rules" line so discovery stays opt-in', () => {
    render(<AboutModal isOpen onClose={() => {}} />);
    // getByText throws if absent, so reaching the assertion confirms presence
    expect(screen.getByText(/Figuring out the rules is part of the game\./)).toBeTruthy();
  });

  it('invokes onClose when the Close button is pressed', () => {
    const onClose = vi.fn();
    render(<AboutModal isOpen onClose={onClose} />);
    screen.getByRole('button', { name: 'Close' }).click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
