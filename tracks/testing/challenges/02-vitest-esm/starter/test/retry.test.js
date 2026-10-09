import { describe, test, expect, vi } from 'vitest';
import { retry } from '../src/retry.js';

describe('retry', () => {
  test('returns the result when the first attempt works', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(retry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  // TODO: fails twice then works, gives up after `attempts`, onRetry
});
