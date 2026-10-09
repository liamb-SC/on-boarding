import { Transform } from 'node:stream';

// 1. Write `count` lines ("line 0\n", "line 1\n", ...) to `writable`,
//    respecting backpressure, then end it. Resolve once everything has been
//    flushed (the 'finish' event).
export async function writeLines(writable, count) {
  for (let i = 0; i < count; i++) {
    writable.write(`line ${i}\n`);
  }
  writable.end();
}

// 2. A Transform that upper-cases text, buffering at most 4 KiB (4096 bytes)
//    on each side: set its highWaterMark.
export function createUpperCase() {
  return new Transform({
    transform(chunk, encoding, callback) {
      callback(null, chunk.toString().toUpperCase());
    },
  });
}

// 3. source -> createUpperCase() -> destination, with backpressure. Resolve
//    when the destination has finished. If ANY stream fails, reject with that
//    error and destroy the others.
export async function copyUpper(source, destination) {
  source.on('data', (chunk) => destination.write(chunk.toString().toUpperCase()));
  source.on('end', () => destination.end());
}
