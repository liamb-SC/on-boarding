# 02 · Hooks: useState, useEffect and custom hooks

**Skills:** `useState`, functional updates, `useEffect` with dependencies and
cleanup, writing and composing custom hooks.

## Background
- **`useState`** gives a component memory that survives re-renders:
  `const [count, setCount] = useState(0)`. Calling the setter schedules a
  re-render with the new value. A plain `let` variable is reset on every
  render, and changing it never triggers one.
- The setter doesn't change `count` straight away. Inside one click handler,
  `count` is the value from that render. When the new value depends on the
  old one, pass a function: `setCount((c) => c + 1)`.
- **`useEffect(fn, deps)`** runs `fn` after render, and again whenever a value
  in `deps` changes. Use it to sync with things outside React (the DOM, timers,
  subscriptions). If `fn` returns a function, React calls that **cleanup**
  before the next run and on unmount.
- A **custom hook** is a function whose name starts with `use` and which calls
  other hooks. It's how you share stateful logic between components.

## Scenario
`src/components/Counter.jsx` has a bug report: "the buttons do nothing".
`src/components/Search.jsx` should only search once the user stops typing, and
it relies on two custom hooks in `src/hooks/` that are still empty. Run
`npm run dev` to try things in the browser.

## Goal
1. **Fix `Counter`** with `useState`: `+1`, `+3` and `Reset` all work, and the
   page shows `Count: N`. Keep `addThree` calling `increment()` three times.
2. **`useDocumentTitle(title)`** sets `document.title` to `title`, keeps it
   updated when `title` changes, and restores the previous title on unmount.
3. **`useDebouncedValue(value, delay)`** returns the first `value` immediately.
   After that it only updates once `value` has stopped changing for `delay` ms.
   It cancels any pending timer when the value changes or the component
   unmounts.
4. **`Search`** keeps the input's text in state (a controlled input) and
   debounces it by 300 ms. It sets the tab title to `Search: <text>` (or just
   `Search` while empty), and calls `onSearch(text)` each time the debounced
   text changes, unless it's empty.

## Hints
- If `+3` only adds one, read the second bullet in Background again.
- `setTimeout` returns an id that `clearTimeout(id)` cancels. Return that from
  your effect.
- A component can call `onSearch` from a `useEffect` that depends on the
  debounced value.
- In dev, `<StrictMode>` mounts components twice to flush out missing
  cleanups, so you may see effects run twice in the console. That's expected.

## Check your work
```
./onboard validate react/02
```
