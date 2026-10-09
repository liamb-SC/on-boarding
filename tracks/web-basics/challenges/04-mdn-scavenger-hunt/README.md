# 04 · MDN scavenger hunt

**Skills:** finding answers on MDN Web Docs: element and attribute reference
pages, CSS property pages (look for "Initial value" in the **Formal
definition** box), JavaScript built-ins, HTTP status codes and headers, ARIA.

## Background
[MDN Web Docs](https://developer.mozilla.org) is the reference for HTML, CSS,
JavaScript, HTTP and browser APIs. It's written by Mozilla and the browser
vendors, and it's usually better than the first search result. Every reference
page follows the same layout: a summary, a live **Try it** example, syntax,
values, a formal definition, examples, specifications, and **Browser
compatibility** tables.

Tips:
- Put `mdn` in your search ("mdn flex-shrink"), or use the site search.
- The left sidebar lists every sibling page, such as all HTML elements or all
  HTTP status codes.

## Goal
Answer each question in `answers.json`. Put the answer in `answer` and the URL
of the MDN page that told you in `source`.

| Key | Question |
|-----|----------|
| `semanticElement` | Which HTML element represents a self-contained composition that's intended to be independently distributable or reusable (a blog post, a forum post, a news story)? |
| `colorInput` | Which `type` of `<input>` lets the user pick a colour? |
| `flexShrinkInitial` | What's the **initial value** of the CSS `flex-shrink` property? |
| `stickyPosition` | Which value of CSS `position` keeps an element in the normal flow until scrolling reaches a threshold, then holds it in place? |
| `sortedCopy` | Which `Array` method returns a sorted **copy** and leaves the original array alone? |
| `tooManyRequests` | Which HTTP status code means "Too Many Requests" (rate limited)? |
| `corsHeader` | Which response header tells the browser which origin is allowed to read a cross-origin response? |
| `announceUpdates` | Which attribute makes screen readers announce changes to a region of the page (e.g. a status message)? |
| `deepCopy` | Which global function makes a deep copy of a value, including `Map`s, `Date`s and circular references? |

Short answers are fine: `flex`, not a paragraph.

## Hints
- `answers.json` must stay valid JSON. Run `node -e 'require("./answers.json")'`
  to check.
- Check a page's **Browser compatibility** table before relying on a newer
  feature at work. `toSorted` and `structuredClone` are fairly recent.

## Check your work
```
./onboard validate web-basics/04
```
