// A downstream email provider: slow, and sometimes down. Don't edit this file.
//   createEmailService({ latencyMs: 500 })   every send takes 500ms
//   createEmailService({ down: true })       every send throws
//   createEmailService({ failTimes: 2 })     the first 2 sends throw, then it recovers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function createEmailService({ latencyMs = 300, down = false, failTimes = 0 } = {}) {
  let failuresLeft = failTimes;
  return {
    sent: [],
    attempts: 0,
    async send(to, body) {
      this.attempts += 1;
      await sleep(latencyMs);
      if (this.down ?? down) throw new Error('email provider unavailable (503)');
      if (failuresLeft > 0) { failuresLeft -= 1; throw new Error('email provider timeout'); }
      this.sent.push({ to, body });
    },
  };
}
