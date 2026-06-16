// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { VisitorCounter } from './VisitorCounter';

const SRC = 'https://nostalgic.llll-ll.com/components/visit.js';
const scriptCount = () => document.querySelectorAll(`script[src="${SRC}"]`).length;

afterEach(() => {
  cleanup();
  document.querySelectorAll(`script[src="${SRC}"]`).forEach((s) => s.remove());
});

describe('VisitorCounter', () => {
  it('injects the nostalgic visit.js script', () => {
    render(<VisitorCounter />);
    expect(scriptCount()).toBe(1);
  });

  it('does not inject a second copy across mount/unmount/remount', () => {
    // The script declares module-level globals (COUNTER_I18N) and defines a
    // custom element; a second evaluation throws. Re-mounting must not re-add it.
    const a = render(<VisitorCounter />);
    a.unmount();
    render(<VisitorCounter />);
    render(<VisitorCounter />);
    expect(scriptCount()).toBe(1);
  });
});
