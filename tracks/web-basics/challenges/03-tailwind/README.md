# 03 · Tailwind CSS: utility classes and the CLI build

**Skills:** utility-first CSS, spacing/colour/typography utilities, flex and
grid utilities, responsive (`md:`) and state (`hover:`) variants, building
CSS with the Tailwind CLI.

## Background
Instead of writing `.profile-card { display: flex; padding: 1.5rem; ... }`,
Tailwind gives you one small class per declaration and you compose them in the
markup:

```html
<div class="flex items-center gap-4 p-6 bg-white rounded-xl shadow">...</div>
```

- Spacing uses a scale: `p-4` is `1rem`, `p-6` is `1.5rem`, `gap-4` is `1rem`.
  `px-`/`py-` set horizontal and vertical padding, `ml-auto` pushes an item right.
- Colours are `bg-blue-600`, `text-gray-500` and so on (50 is lightest, 950 darkest).
- **Variants** prefix a class: `md:grid-cols-3` applies from the `md`
  breakpoint (48rem) up, which makes it mobile-first. `hover:bg-blue-700`
  applies on hover.
- The **build** scans your files for class names and writes a CSS file with
  only those utilities, so the output stays small. With Tailwind v4 the input
  file is just `@import "tailwindcss";`.

## Scenario
`index.html` is an unstyled team page: three profile cards in a `<main>`. It
already links `dist/output.css`, which doesn't exist yet. Tailwind and its CLI
are installed.

## Goal
1. Make `src/input.css` import Tailwind, and add an npm `build` script that
   compiles it to `dist/output.css` with the Tailwind CLI.
2. Style the page with classes only (no `<style>`, no `style=""`). The
   validator checks the elements with an `id`:
   - `#team`: a `grid`, `grid-cols-1` on phones, `md:grid-cols-3` from md up, with a `gap-*`.
   - `#card`: a `flex` row with `items-center`, a `gap-*`, padding (`p-*`),
     `bg-white`, rounded corners (`rounded-*`) and a `shadow*`.
   - `#avatar`: a 64px circle (`size-16` or `w-16 h-16`, `rounded-full`).
   - `#name`: large (`text-lg`/`xl`/`2xl`) and bold (`font-semibold`/`bold`).
   - `#role`: `text-sm` in a grey (`text-gray-500`, `text-slate-600`...).
   - `#follow`: a coloured background, a darker `hover:bg-*`, `text-white`,
     `px-*`/`py-*`, rounded, and pushed right with `ml-auto`.
3. Copy the card classes to the other two cards so the page looks consistent.
4. `npm run build`, then open `index.html` and resize the window.

## Hints
- `npx @tailwindcss/cli -i src/input.css -o dist/output.css --watch` rebuilds
  on every save while you work. Make the npm script the same command without
  `--watch`.
- Inside npm scripts, the binary is just `tailwindcss`.
- The Tailwind CSS IntelliSense editor extension autocompletes class names and
  shows the CSS behind each one.
- Search any utility at <https://tailwindcss.com/docs>.

## Check your work
```
./onboard validate web-basics/03
```
