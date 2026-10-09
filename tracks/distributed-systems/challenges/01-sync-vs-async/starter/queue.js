// An in-process message queue, standing in for SQS/RabbitMQ. Don't edit this file.
//
//   queue.send(message)          enqueue a message and return right away
//   queue.consume(async (msg) => { ... })
//                                handle messages one at a time. If the handler
//                                throws, the message is redelivered later (up
//                                to maxAttempts), then moved to queue.deadLetters
//   await queue.drain()          wait until every message is handled (for tests and demos)
export function createQueue({ maxAttempts = 5, retryDelayMs = 20 } = {}) {
  const ready = [];
  const deadLetters = [];
  let handler = null;
  let inFlight = 0;
  let waiters = [];
  let pumping = false;

  const settle = () => {
    if (ready.length === 0 && inFlight === 0) { waiters.forEach((w) => w()); waiters = []; }
  };

  async function pump() {
    if (!handler || pumping) return;
    pumping = true;
    while (ready.length) {
      const entry = ready.shift();
      inFlight += 1;
      try {
        await handler(structuredClone(entry.message));
      } catch {
        entry.attempts += 1;
        if (entry.attempts >= maxAttempts) deadLetters.push(entry.message);
        else {
          inFlight += 1;
          setTimeout(() => { inFlight -= 1; ready.push(entry); pump(); }, retryDelayMs);
        }
      } finally {
        inFlight -= 1;
      }
    }
    pumping = false;
    settle();
  }

  return {
    deadLetters,
    get depth() { return ready.length; },
    send(message) {
      ready.push({ message: structuredClone(message), attempts: 0 });
      queueMicrotask(pump);
    },
    consume(fn) { handler = fn; queueMicrotask(pump); },
    drain() { return new Promise((resolve) => { waiters.push(resolve); queueMicrotask(settle); }); },
  };
}
