# Track: Web basics

A quick tour of the web platform: semantic, accessible HTML, CSS layout,
Tailwind, finding answers on MDN, Core Web Vitals, and measuring your own code
with the Performance API and DevTools. Each challenge is a small, hands-on fix
to a real page.

## Requirements
Node.js 20+ and network access to the npm registry. A desktop browser with
DevTools (Chrome or Edge is best for 05 and 06) for looking at your pages.
The validators don't need one: they parse and run your pages with jsdom.

## Learning objectives
By the end you can:
- Structure a page with landmarks, a sensible heading outline and accessible forms.
- Explain `content-box` vs `border-box`, and lay out a page with flexbox and grid.
- Style with Tailwind utilities (including `md:` and `hover:`) and build the CSS with its CLI.
- Find reference answers quickly on MDN.
- Explain LCP, CLS and INP, fix their usual causes, and measure them with `web-vitals`.
- Instrument code with `performance.mark`/`measure`, collect entries with a
  `PerformanceObserver`, and find them in the DevTools Performance panel.

## Challenges (do them in order)
| # | Challenge | Core concepts |
|---|-----------|---------------|
| 01 | semantic-html | landmarks, headings, `<article>`, `alt`, `<form>` + `<label>`, input types, `<button>` |
| 02 | css-box-flex-grid | box model, `box-sizing`, `margin: auto`, flexbox, grid, `gap`, `span` |
| 03 | tailwind | utility classes, `md:` / `hover:` variants, `@import "tailwindcss"`, the Tailwind CLI |
| 04 | mdn-scavenger-hunt | navigating MDN reference pages for HTML, CSS, JS, HTTP and ARIA |
| 05 | web-vitals | LCP / CLS / INP thresholds and fixes, `fetchpriority`, `defer`, yielding, `web-vitals`, Lighthouse |
| 06 | performance-api | `performance.mark`/`measure`, `PerformanceObserver`, long tasks, DevTools Performance panel |

Start with: `./onboard start web-basics/01`
