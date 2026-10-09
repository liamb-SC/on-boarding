import { Readable, Writable } from 'node:stream';
import { check, expect, expectEqual, fromSandbox, watchdog } from '../../../../lib/checks.mjs';
import { within } from '../../sched.mjs';

watchdog(60000);
const s = await fromSandbox('./streams.js');

// A slow consumer: each chunk takes one event loop turn. Records what it got
// and the most data ever queued in front of it.
function slowSink(highWaterMark) {
  const got = [];
  let peak = 0;
  const sink = new Writable({
    highWaterMark,
    write(chunk, encoding, callback) {
      peak = Math.max(peak, this.writableLength);
      got.push(chunk.toString());
      setImmediate(callback);
    },
  });
  return Object.assign(sink, { got, peak: () => peak });
}

// A source that makes chunks only when asked (read()), and counts them.
function countingSource(chunks, { failAfter } = {}) {
  let made = 0;
  const src = new Readable({
    highWaterMark: 1024,
    read() {
      if (failAfter !== undefined && made === failAfter) return this.destroy(new Error('disk on fire'));
      if (made === chunks) return this.push(null);
      this.push(`chunk-${String(made++).padStart(5, '0')}|`.padEnd(100, 'x'));
    },
  });
  return Object.assign(src, { made: () => made });
}

await check('writeLines writes every line, in order', async () => {
  const sink = slowSink(256);
  await within(20000, Promise.resolve(s.writeLines(sink, 2000)).then(() =>
    sink.writableFinished || new Promise((r) => sink.once('finish', r))), 'writeLines');
  const lines = sink.got.join('').split('\n').filter(Boolean);
  expectEqual(lines.length, 2000, 'lines received: ');
  expect(lines.every((l, i) => l === `line ${i}`), 'lines arrived out of order or mangled');
});

await check('writeLines respects backpressure (waits for "drain" when write() returns false)', async () => {
  const sink = slowSink(256);
  await within(20000, Promise.resolve(s.writeLines(sink, 2000)).then(() =>
    sink.writableFinished || new Promise((r) => sink.once('finish', r))), 'writeLines');
  expect(sink.peak() <= 256 + 16, `${sink.peak()} bytes piled up in a stream whose highWaterMark is 256`);
});

await check('writeLines resolves only once the stream has finished', async () => {
  const sink = slowSink(256);
  await within(20000, Promise.resolve(s.writeLines(sink, 500)), 'writeLines');
  expect(sink.writableFinished, 'it resolved before the "finish" event');
});

await check('createUpperCase has a 4096-byte highWaterMark on both sides', () => {
  const t = s.createUpperCase();
  expectEqual([t.writableHighWaterMark, t.readableHighWaterMark], [4096, 4096]);
});

await check('createUpperCase upper-cases what passes through', async () => {
  const out = [];
  for await (const chunk of Readable.from(['hello ', 'streams']).pipe(s.createUpperCase())) out.push(chunk.toString());
  expectEqual(out.join(''), 'HELLO STREAMS');
});

await check('copyUpper copies everything, upper-cased, and resolves when the destination finishes', async () => {
  const src = countingSource(1500);
  const sink = slowSink(1024);
  await within(20000, Promise.resolve(s.copyUpper(src, sink)), 'copyUpper');
  expect(sink.writableFinished, 'it resolved before the destination finished');
  const text = sink.got.join('');
  expectEqual(text.length, 1500 * 100, 'bytes received: ');
  expect(text === text.toUpperCase(), 'some text was not upper-cased');
  expect(text.startsWith('CHUNK-00000|') && text.includes('CHUNK-01499|'), 'chunks missing or out of order');
});

await check('copyUpper reads only as fast as the destination writes (bounded memory)', async () => {
  const src = countingSource(1500);
  const sink = slowSink(1024);
  let maxAhead = 0;
  const watch = setInterval(() => { maxAhead = Math.max(maxAhead, src.made() - sink.got.length); }, 1);
  try {
    await within(20000, Promise.resolve(s.copyUpper(src, sink)).then(() =>
      sink.writableFinished || new Promise((r) => sink.once('finish', r))), 'copyUpper');
  } finally {
    clearInterval(watch);
  }
  // source buffer (~10 chunks) + transform (~2 × 40) + sink (~10): about 100 chunks in flight
  expect(maxAhead <= 200, `the source got ${maxAhead} chunks ahead of the destination (of 1500): nothing is slowing it down`);
});

await check('copyUpper rejects when the source fails, and destroys the destination', async () => {
  const src = countingSource(1500, { failAfter: 50 });
  const sink = slowSink(1024);
  sink.on('error', () => {});
  const err = await within(5000, Promise.resolve(s.copyUpper(src, sink)).then(() => null, (e) => e), 'copyUpper with a failing source');
  expect(err?.message === 'disk on fire', err ? `rejected with "${err.message}"` : 'it resolved');
  expect(sink.destroyed, 'the destination was left open');
});
