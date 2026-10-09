# 07 · Component libraries: shadcn/ui and Material UI

**Skills:** two models of UI library: copied-in source (shadcn/ui + Tailwind
+ `cva`) and an installed package with a theme (MUI); variants; theming;
composing library components.

## Background
**Material UI (MUI)** is a classic component library. You `npm install` it,
import `<Button>`, `<TextField>`, `<Alert>`..., and customise them through
**props** (`variant="contained"`, `severity="success"`, `error`,
`helperText`) and a **theme** provided at the root
(`createTheme({ palette: { primary: { main: '#...' } } })`). You get a lot
for free, upgrades come from npm, and deep customisation means working with
the library's APIs.

**shadcn/ui** isn't a dependency at all. `npx shadcn add button` **copies
the component's source into your repo** (`src/components/ui/button.jsx`),
and from then on it's your code:

- styling is Tailwind classes, and variants are declared with `cva`
  (class-variance-authority): `variant` and `size` map to class lists;
- `cn()` (clsx + tailwind-merge) combines classes so a `className` you pass
  overrides the variant's conflicting classes;
- you change it by editing the file. No waiting for a release, but there are
  also no automatic updates. Under the hood, most shadcn components wrap
  headless, accessible primitives (Radix UI).

`components.json` is the config file the shadcn CLI reads to know where to
copy things.

## Scenario
`src/components/ui/button.jsx` was added with the shadcn CLI. Design want a
green "success" button, and `App.jsx` already uses `<Button variant="success">`,
but that variant doesn't exist yet. Next to it, the newsletter box in
`src/components/NewsletterSignup.jsx` is built from bare HTML and should use
MUI. Run `npm run dev` (Tailwind loads from a CDN in `index.html`, for the
demo only).

## Goal
**shadcn/ui**
1. Add a `success` variant to `buttonVariants`, with the classes
   `bg-green-600 text-white shadow-sm hover:bg-green-700`. Leave the other
   variants as they are.

**Material UI**

2. In `src/theme.js`, make the theme's primary colour `#6c2bd9`.
3. Rebuild `NewsletterSignup` with MUI components:
   - a `TextField` labelled `Email` and a `variant="contained"` `Button`
     labelled `Subscribe`;
   - submitting an email without `@` puts the TextField in its `error` state
     with `helperText` `Enter a valid email`;
   - a valid email replaces the form with
     `<Alert severity="success">Subscribed <email></Alert>`.

## Hints
- Import MUI components from `@mui/material`. Read the props on
  [mui.com](https://mui.com/material-ui/react-text-field/), because that's
  where MUI's knobs are.
- Don't forget `e.preventDefault()` in the form's submit handler.
- Watch the Subscribe button pick up the theme colour on the dev server.

## Check your work
```
./onboard validate react/07
```
