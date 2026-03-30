// retryUtil.ts — Retry với exponential backoff
// Acceptance Criteria: Consumer retry 3 lần với backoff khi VeChain timeout

export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number; label?: string } = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 1_000, label = 'operation' } = options;
  let lastError: Error = new Error('Unknown');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === maxAttempts) break;
      const delay = baseDelayMs * Math.pow(2, attempt - 1); // 1s → 2s → 4s
      console.warn(`[retry] ${label} failed (${attempt}/${maxAttempts}): ${lastError.message}. Retry in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastError;
}