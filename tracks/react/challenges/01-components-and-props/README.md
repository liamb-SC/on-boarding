# 01 · Components and props

**Skills:** function components, JSX, props and destructuring, default values,
`children`, conditional rendering, lists and `key`, passing callbacks down.

## Background
A React **component** is a function that takes one object, its **props**,
and returns JSX describing the UI:

```jsx
function Greeting({ name, excited = false }) {   // destructure + default
  return <p>Hello {name}{excited && '!'}</p>;    // {…} embeds JavaScript
}
<Greeting name="Ada" excited />                  // excited={true}
```

- Props flow **down** and are read-only. To let a child report something
  back up, pass a **callback** prop (`onSelect`) and have the child call it.
- Whatever you nest between a component's tags arrives as `props.children`.
  That's how layout wrappers like `<Card>` work.
- `{cond && <X />}` renders `X` only when `cond` is true, and
  `if (...) return ...` handles whole alternative states.
- Render lists with `array.map(...)`, and give each item a stable, unique
  **`key`** (an id, not the array index) so React can track items between
  renders.

## Scenario
A team page. `src/App.jsx` already uses three components that are only stubs:
`Card`, `TeamMember` and `TeamList` in `src/components/`. Run `npm run dev`
and open the URL it prints to see the page as you go.

## Goal
1. **`Card`** renders a `<section>` with the `title` prop as an `<h2>`, then
   its `children`.
2. **`TeamMember`** takes `name`, `role` and `isLead`. It shows the name in an
   `<h3>` and the role in a `<p>`. `role` defaults to `"Engineer"`. A
   `<span>Lead</span>` badge appears only when `isLead` is true.
3. **`TeamList`** takes `members` and `onSelect`:
   - an empty array renders `<p>No team members yet</p>` (and no list);
   - otherwise a `<ul>` with one `<li>` per member, using the member's `id` as
     the key. Each `<li>` contains a `<TeamMember>` and a button labelled
     `View <name>` (e.g. `View Grace Hopper`);
   - clicking that button calls `onSelect(member.id)`.

## Hints
- `<TeamMember {...member} />` spreads an object's fields in as props.
- `onClick={() => onSelect(m.id)}` passes a function. `onClick={onSelect(m.id)}`
  would call it straight away, during render.
- The validator's tests are in this challenge's `spec.test.jsx` in the repo.
  Read them if a check's message isn't enough.

## Check your work
```
./onboard validate react/01
```
