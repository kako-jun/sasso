export interface RetryOptions {
  attempts?: number; // total attempts (default 3)
  backoffMs?: number[]; // delay BEFORE attempt i (index 0 = before first). default [0, 800, 1600]
}

/**
 * Run an async fn, retrying on rejection. Waits backoffMs[i] before attempt i.
 * Returns the first successful result; throws the LAST error if all attempts fail.
 */
export async function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  const attempts = options?.attempts ?? 3;
  const backoff = options?.backoffMs ?? [0, 800, 1600];
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    const delay = backoff[i] ?? backoff[backoff.length - 1] ?? 0;
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    try {
      return await fn();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}
