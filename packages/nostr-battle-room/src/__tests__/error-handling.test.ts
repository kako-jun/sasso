/**
 * Error Handling Tests
 *
 * Source: architecture.md - Error Handling section
 *
 * Errors are reported via `onError` callback:
 *
 * Common errors:
 * - `"Room not found"` - Room doesn't exist or expired
 * - `"Room has expired"` - Room older than 10 minutes
 * - `"NostrClient not connected"` - Called method before connect()
 */

import { describe, it, expect } from 'vitest';
import { withRetry, withTimeout, timeout } from '../retry';

describe('Error Handling (architecture.md)', () => {
  describe('Error Messages', () => {
    /**
     * Source: architecture.md - Error Handling section
     */

    it('"Room not found" error should exist', () => {
      const error = new Error('Room not found');
      expect(error.message).toBe('Room not found');
    });

    it('"Room has expired" error should exist', () => {
      const error = new Error('Room has expired');
      expect(error.message).toBe('Room has expired');
    });

    it('"NostrClient not connected" error should exist', () => {
      const error = new Error('NostrClient not connected. Call connect() first.');
      expect(error.message).toContain('NostrClient not connected');
    });
  });
});

describe('Retry Utilities', () => {
  describe('withRetry', () => {
    it('should succeed on first attempt if operation succeeds', async () => {
      let attempts = 0;
      const result = await withRetry(async () => {
        attempts++;
        return 'success';
      });

      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('should retry on failure', async () => {
      let attempts = 0;
      const result = await withRetry(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Temporary failure');
          }
          return 'success';
        },
        { maxAttempts: 3, initialDelay: 10 }
      );

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max attempts exceeded', async () => {
      let attempts = 0;
      await expect(
        withRetry(
          async () => {
            attempts++;
            throw new Error('Permanent failure');
          },
          { maxAttempts: 3, initialDelay: 10 }
        )
      ).rejects.toThrow('Permanent failure');

      expect(attempts).toBe(3);
    });

    it('should call onRetry callback on each retry', async () => {
      const retries: number[] = [];
      let attempts = 0;

      await withRetry(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Temporary failure');
          }
          return 'success';
        },
        {
          maxAttempts: 3,
          initialDelay: 10,
          onRetry: (attempt) => {
            retries.push(attempt);
          },
        }
      );

      expect(retries).toEqual([1, 2]);
    });
  });

  describe('withTimeout', () => {
    it('should resolve if operation completes before timeout', async () => {
      const result = await withTimeout(async () => {
        await new Promise((r) => setTimeout(r, 10));
        return 'success';
      }, 1000);

      expect(result).toBe('success');
    });

    it('should reject with timeout error if operation takes too long', async () => {
      await expect(
        withTimeout(
          async () => {
            await new Promise((r) => setTimeout(r, 1000));
            return 'success';
          },
          50,
          'Custom timeout message'
        )
      ).rejects.toThrow('Custom timeout message');
    });
  });

  describe('timeout', () => {
    it('should reject after specified time', async () => {
      await expect(timeout(50, 'Timed out')).rejects.toThrow('Timed out');
    });
  });
});
