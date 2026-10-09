# 02 · CSS: box model, flexbox and grid

**Skills:** the box model (`content-box` vs `border-box`), padding, border
and margin, centring with `margin: auto`, flexbox for one row, grid for a 2-D
layout, `gap`, spanning grid columns.

## Background
**The box model.** Every element is a box made of content, then padding,
then border, then margin. By default (`box-sizing: content-box`), `width` sets
only the content, so padding and border are **added** on top. With
`box-sizing: border-box`, `width` is the size from border edge to border edge,
and the padding and border fit inside it. Almost every codebase starts with:

```css
*, *::before, *::after { box-sizing: border-box; }
```

**Flexbox** lays items out in **one** direction. The container controls
spacing on the main axis (`justify-content`) and alignment on the cross axis
(`align-items`). `gap` puts space between the items.

**Grid** lays items out in rows **and** columns.
`grid-template-columns: repeat(3, 1fr)` makes three equal columns, and a child
can stretch across several with `grid-column: span 2`.

## Scenario
`index.html` is a photo page with a header, an intro card and a six-tile
gallery. `styles.css` only sets colours, so everything is stacked. Open
`index.html` in a browser to see it.

## Goal
1. **Box model, on paper.** For `.box { width: 200px; padding: 20px;
   border: 5px solid; margin: 10px }`, fill in `box-model.json` (numbers, in px):
   - `contentBoxWidth`: its rendered width (border to border) with `content-box`
   - `borderBoxWidth`: its rendered width with `border-box`
   - `borderBoxContentWidth`: the width left for content with `border-box`
   - `contentBoxSpaceTaken`: the horizontal space it occupies, margins included, with `content-box`
2. **Box model, in CSS.** Make every element `border-box`. Make `.card` `600px`
   wide with `24px` padding and a `2px` border, centred with auto left/right margins.
3. **Flexbox.** `.site-header` puts the logo on the left and the nav on the
   right, vertically centred. `.nav` lays its links out in a row with a `gap`.
4. **Grid.** `.gallery` is three equal columns with a `gap`. The `.wide` tile
   spans two columns.

## Hints
- DevTools → Elements → **Computed** draws the box model for the selected
  element, with the numbers on each layer.
- Selecting a flex or grid container in DevTools shows a `flex`/`grid` badge.
  Click it to overlay the lines and gaps.
- Don't edit `index.html`: the validator uses its own copy of the markup with
  your `styles.css`.

## Check your work
```
./onboard validate web-basics/02
```
