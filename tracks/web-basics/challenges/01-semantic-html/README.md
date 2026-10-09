# 01 · Semantic HTML, forms and accessibility basics

**Skills:** landmark elements (`header`, `nav`, `main`, `article`, `footer`),
heading hierarchy, `alt` text, `<form>` with `<label>`, input types and
`required`, real `<button>`s.

## Background
HTML describes what things **are**, not how they look (CSS does that). When
the markup says "this is the navigation", "this is the main content", "this is
a heading", then screen readers, keyboard users, search engines and browser
features like reader mode and form autofill all work for free.

| Instead of | Use |
|-----------|-----|
| `<div class="header">` | `<header>`, `<nav>`, `<main>`, `<footer>` |
| `<div class="title">` | `<h1>`…`<h6>`: one `h1`, and don't skip levels |
| `<div class="post">` | `<article>` for a self-contained piece |
| `Email <input>` | `<label for="email">Email</label> <input id="email" type="email">` |
| `<div onclick>` | `<button>`, which is focusable, works with Enter/Space, and submits forms |

Images need `alt` text that says what the image shows. Use `alt=""` only for
purely decorative ones.

## Scenario
`index.html` is a bakery's homepage built entirely from `<div>`s. It looks
fine but tells assistive technology nothing.

## Goal
Rewrite `index.html` (keep the content, the links and the input `id`s):

1. `<!doctype html>` and `<html lang="en">`.
2. Landmarks: `<header>` holding the logo and a `<nav>` with the three links,
   one `<main>`, and a `<footer>`.
3. Headings: "Fresh bread, every morning" is the only `<h1>`. "Sourdough is
   back" is an `<h2>` inside an `<article>`. "Order ahead" is an `<h2>`.
4. The image gets real `alt` text.
5. The order inputs go in a `<form>`, each with a `<label>`. `email` is
   `type="email"`, `loaves` is `type="number"` with `min="1"`, and name and
   email are `required`. Submit with a `<button type="submit">`.

## Hints
- Open the page in a browser and press Tab. Can you reach the Order button?
  Then try the **Accessibility** pane in DevTools (Elements → Accessibility),
  or Lighthouse's Accessibility audit.
- `<label for="x">` must match the input's `id`. Wrapping the input in its
  label also works.
- With `required` and `type="email"`, the browser validates the form before
  submitting, with no JavaScript.

## Check your work
```
./onboard validate web-basics/01
```
