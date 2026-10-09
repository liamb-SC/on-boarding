// A fast producer and a slow consumer (a "disk" that takes a moment per chunk).
// Watch how much piles up in memory in between.
import { Readable, Writable } from 'node:stream';
import { copyUpper, writeLines } from './streams.js';

function slowDisk() {
  let peak = 0;
  const disk = new Writable({
    highWaterMark: 16 * 1024,
    write(chunk, encoding, callback) {
      peak = Math.max(peak, this.writableLength);
      setImmediate(callback);
    },
  });
  disk.peak = () => peak;
  return disk;
}
const kb = (n) => `${Math.round(n / 1024)} KiB`;

const finished = (disk) => new Promise((resolve) => disk.writableFinished ? resolve() : disk.once('finish', resolve));

const disk1 = slowDisk();
await writeLines(disk1, 100_000);
const doneOnTime = disk1.writableFinished;
await finished(disk1);
console.log(`writeLines: peak buffered ${kb(disk1.peak())} (limit ${kb(disk1.writableHighWaterMark)}), finished when it resolved: ${doneOnTime}`);

const disk2 = slowDisk();
const source = Readable.from(Array.from({ length: 5000 }, (_, i) => `chunk ${i} `.padEnd(256, '.')));
await copyUpper(source, disk2);
await finished(disk2);
console.log(`copyUpper: peak buffered ${kb(disk2.peak())} (limit ${kb(disk2.writableHighWaterMark)})`);
console.log(`memory in use: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MiB`);
