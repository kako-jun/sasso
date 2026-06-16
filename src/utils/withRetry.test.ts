import { describe, it, expect, vi } from 'vitest';
import { withRetry } from './withRetry';

describe('withRetry', () => {
  it('resolves on first success without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries after failures and resolves on a later attempt', async () => {
    // Fails twice, then succeeds on the 3rd attempt.
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('cold relay 1'))
      .mockRejectedValueOnce(new Error('cold relay 2'))
      .mockResolvedValue('joined');
    const result = await withRetry(fn, { backoffMs: [0, 0, 0] });
    expect(result).toBe('joined');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws the LAST error when all attempts fail', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('first'))
      .mockRejectedValueOnce(new Error('second'))
      .mockRejectedValue(new Error('last'));
    await expect(withRetry(fn, { backoffMs: [0, 0, 0] })).rejects.toThrow('last');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('respects a custom attempts count', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('nope'));
    await expect(withRetry(fn, { attempts: 5, backoffMs: [0, 0, 0, 0, 0] })).rejects.toThrow(
      'nope'
    );
    expect(fn).toHaveBeenCalledTimes(5);
  });
});
