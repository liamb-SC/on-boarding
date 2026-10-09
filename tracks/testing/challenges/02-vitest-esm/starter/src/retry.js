// Call `fn` until it succeeds, at most `attempts` times in total.
// Before each new attempt, `onRetry(error, attemptNumber)` is called with the
// error that just happened. If every attempt fails, the last error is thrown.
export async function retry(fn, { attempts = 3, onRetry = () => {} } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (attempt < attempts) onRetry(err, attempt);
    }
  }
  throw lastError;
}
