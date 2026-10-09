// A backend whose latency you script. Don't edit this file.
//   const svc = createBackend([20, 300, 15]);   // 1st call takes 20ms, 2nd 300ms, 3rd 15ms, then repeats
//   await svc.call(signal)                        // resolves { latencyMs }, or rejects if signal aborts
//   svc.calls / svc.cancelled                     // how many started, and how many were aborted mid-flight
// A latency of -1 makes that call fail (after 10ms).
export function createBackend(latencies) {
  const svc = {
    calls: 0,
    cancelled: 0,
    call(signal) {
      const ms = latencies[svc.calls % latencies.length];
      svc.calls += 1;
      return new Promise((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
          settled = true;
          if (ms < 0) reject(new Error('backend error'));
          else resolve({ latencyMs: ms });
        }, ms < 0 ? 10 : ms);
        signal?.addEventListener('abort', () => {
          if (settled) return; // aborting a finished call is a no-op
          settled = true;
          clearTimeout(timer);
          svc.cancelled += 1;
          reject(signal.reason ?? new Error('aborted'));
        }, { once: true });
      });
    },
  };
  return svc;
}
