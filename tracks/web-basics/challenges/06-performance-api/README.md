# 06 · Frontend tracing: the Performance API and the DevTools Performance panel

**Skills:** `performance.now()`, `performance.mark()` / `performance.measure()`
(User Timing), `PerformanceObserver`, long tasks, and reading your own
measures in the DevTools **Performance** panel.

## Background
"It's slow" isn't actionable. "`loadRows` takes 120 ms of a 125 ms build" is.
The browser (and Node) has a built-in tracing API for this:

```js
performance.mark('work:start');            // a named timestamp
doWork();
performance.mark('work:end');
performance.measure('work', 'work:start', 'work:end');   // a named duration between two marks
```

- Marks and measures are **entries** on a shared timeline. Read them with
  `performance.getEntriesByName('work', 'measure')`.
- A **`PerformanceObserver`** gets entries pushed to it as they're recorded,
  which is how analytics libraries (and `web-vitals`) collect timings without
  polling:
  ```js
  const obs = new PerformanceObserver((list) => list.getEntries().forEach(...));
  obs.observe({ type: 'measure' });   // also 'mark', 'longtask', 'largest-contentful-paint'...
  ```
- DevTools shows your measures on the timeline next to the browser's own work
  when you record in the **Performance** panel, so you can line up "my code"
  with "what the browser did".
- Any main-thread task over a certain length is a **long task**. It blocks
  input and paints, and DevTools flags it with a red corner.

## Scenario
`src/report.js` builds a sales report, and it's slow. `npm run report` runs
it in Node. `npm start` serves `index.html` (<http://localhost:8080>), which runs
the same code in the browser when you click **Build report**.

## Goal
1. In `buildReport()`, add marks `report:start` (first), `report:loaded`
   (after `loadRows`) and `report:end` (last). Then add measures
   `report:load` (start → loaded), `report:aggregate` (loaded → end) and
   `report:total` (start → end). Return the same result as before.
2. Implement `watchMeasures(onMeasure)` in `src/observe.js`: observe
   `measure` entries, call `onMeasure({ name, duration })` for each, and
   return the observer.
3. `npm run report` should now print your three measures. Then in
   `answers.json`:
   - `slowerStep`: which measure takes up most of `report:total`?
   - `longTaskMs`: a task longer than how many milliseconds counts as a "long task"?
   - `devtoolsTrack`: open the page, record in DevTools → **Performance**,
     click **Build report**, stop. Where do your `report:*` measures show up?
     Answer with a letter: **a)** the Network track, **b)** the Timings track,
     **c)** the Console, **d)** the Memory panel.

## Hints
- `performance.measure(name, startMark, endMark)` takes the mark **names**.
- Pass the entry's fields, not the entry itself:
  `onMeasure({ name: e.name, duration: e.duration })`.
- In the Performance panel recording, find the long task under **Main**, then
  zoom in. Your measure sits right above it.
- Calling `performance.clearMarks()` / `clearMeasures()` is useful in tests.
  Don't call them inside `buildReport()`.

## Check your work
```
./onboard validate web-basics/06
```
