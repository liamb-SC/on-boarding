# 05 · Core Web Vitals: LCP, CLS and INP

**Skills:** what LCP, CLS and INP measure and their "good" thresholds,
fixing the usual causes (lazy or low-priority hero images, render-blocking
scripts, missing image dimensions, late-injected content, long click handlers),
measuring with the `web-vitals` library and Lighthouse.

## Background
Google's **Core Web Vitals** are three numbers from real users' browsers:

| Metric | Measures | Usual culprits |
|--------|----------|----------------|
| **LCP**, Largest Contentful Paint | how long until the biggest thing on screen (often a hero image) is drawn | render-blocking `<script>`s in `<head>`, `loading="lazy"` on the hero, the image discovered late or at low priority |
| **CLS**, Cumulative Layout Shift | how much visible content jumps around while loading | images without `width`/`height`, banners and ads injected above content |
| **INP**, Interaction to Next Paint | how long after a click or keypress until the screen updates | long-running event handlers that hog the main thread |

Each has a "good" threshold (look them up on <https://web.dev/articles/vitals>).

Fixes, in short:
- `<script defer>` downloads in parallel and runs after parsing, so it doesn't block.
- The LCP image should load **eagerly** with `fetchpriority="high"`.
- `width`/`height` attributes let the browser reserve the right box before the
  image arrives. CSS `height: auto` still keeps it responsive.
- Reserve space (e.g. `min-height`) for content that arrives later.
- In a handler, **update the UI first, then yield** (`setTimeout`,
  `await scheduler.yield()`, `requestAnimationFrame`) before the heavy work, so
  the browser can paint in between.

## Scenario
A product page with one of each problem. `npm start` serves it on
<http://localhost:8080> (every file has an extra 150 ms of latency, so the
problems are easy to see). `analytics.js` and `heavy.js` belong to other teams:
change how and when they run, not what's in them.

## Goal
1. **Know the numbers.** In `answers.json`, give the "good" thresholds
   (`lcpGoodSeconds`, `clsGood`, `inpGoodMs`). Then label each problem with
   the metric it hurts most: `"LCP"`, `"CLS"` or `"INP"`.
2. **Fix LCP.** Don't lazy-load the hero, give it `fetchpriority="high"`, and
   stop `analytics.js` from blocking rendering.
3. **Fix CLS.** Give the hero its real `width`/`height` (1200 × 600) and reserve
   space for `#promo` in `styles.css`.
4. **Fix INP.** In `app.js`, update `#basket` straight away, then yield before
   calling `buildRecommendations`. It still has to run, and the
   recommendations still have to appear.
5. **Measure.** In `vitals.js`, register `onLCP`, `onCLS` and `onINP` and log
   each metric's `name`, `value` and `rating`. Reload the page and click around:
   the values show in the console. INP is reported when you switch tabs.

## Hints
- DevTools → **Performance** panel → record a reload. Look at the "LCP"
  marker, the "Layout shifts" track, and long tasks with red corners.
- Optional, if you have Chrome:
  `npx lighthouse http://localhost:8080 --only-categories=performance --view`
  before and after your fixes.
- `onINP(log, { reportAllChanges: true })` logs every interaction while you
  experiment.
- In jsdom, the validator's stand-in for `heavy.js` takes 150 ms. Your click
  handler must return in under 50 ms.

## Check your work
```
./onboard validate web-basics/05
```
