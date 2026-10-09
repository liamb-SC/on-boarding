# 08 · Backpressure with streams

**Skills:** what backpressure is, `write()` returning `false` and the
`'drain'` event, `highWaterMark`, and `stream.pipeline` for copying with
error handling.

## Background
When a producer is faster than its consumer (reading a file faster than a
socket can send it, say), the difference has to go somewhere. Without
**backpressure** it piles up in memory until the process falls over.
Backpressure is the consumer saying "slow down".

In Node streams:
- every stream has a buffer limit, its **`highWaterMark`** (bytes, 16 KiB by
  default for most streams).
- `writable.write(chunk)` returns **`false`** once the buffer is over that
  limit. That's your signal to stop writing until the stream emits
  **`'drain'`**. The write still worked: `false` means "stop", not "failed".
- `highWaterMark` is a **threshold**, not a hard cap. Ignore `false` and the
  buffer grows without limit.

Doing this by hand is fiddly, so for copying between streams use
**`pipeline`**:
```js
import { pipeline } from 'node:stream/promises';
await pipeline(source, transform, destination);  // backpressure + cleanup + errors
```
`pipeline` pauses the source whenever any later stage is full. If any stage
fails, it **destroys all of them** and rejects. `a.pipe(b)` handles
backpressure but not errors, and `on('data')` + `write()` handles neither.

## Scenario
`npm start` writes 100,000 lines and copies 5,000 chunks into a slow "disk".
The peak buffered amount is many times the disk's 16 KiB limit.

## Goal
In `streams.js`:
1. `writeLines(writable, count)`: when `write()` returns `false`, wait for
   `'drain'` before writing more. Then `end()` the stream and resolve on
   `'finish'`.
2. `createUpperCase()`: give the Transform a `highWaterMark` of `4096`.
3. `copyUpper(source, destination)`: use `pipeline` from
   `node:stream/promises` with `createUpperCase()` in the middle.

`npm start` should then show peaks close to the limit, and lower memory use.

## Hints
- `import { once } from 'node:events';` then
  `if (!writable.write(line)) await once(writable, 'drain');`
- Same for `'finish'`: `writable.end(); await once(writable, 'finish');`
- A `Transform` takes one `highWaterMark` option for both sides.

## Check your work
```
./onboard validate concurrency/08
```
