# 04 · Shared state: Redux Toolkit and Zustand

**Skills:** when to reach for a store, Redux Toolkit (`createSlice`,
`configureStore`, `Provider`, `useSelector`, `useDispatch`, selectors),
Zustand (`create`, selecting state, actions), immutable updates.

## Background
`useState` is local to one component. When many distant components need the
same data (a cart, the signed-in user), lifting state up gets painful, so you
put it in a **store**. Two popular options:

| | Redux Toolkit | Zustand |
|---|---|---|
| Shape | one store made of **slices**, each with a reducer + actions | one small store per concern, created with a hook |
| Updating | `dispatch(addItem(p))` → the reducer computes new state | call an action: `addItem(p)` → `set(...)` |
| Reading | `useSelector(selectTotal)` | `useCartStore((s) => s.items)` |
| Setup | `<Provider store={store}>` at the root | none |
| Good at | large apps, strict patterns, devtools, RTK Query | small/medium apps, low boilerplate |

Both re-render a component only when the slice of state it **selects**
changes. Both expect immutable updates. Redux Toolkit lets you write
"mutating" code inside `createSlice` because it uses Immer to turn that into
a copy. In Zustand you build new arrays/objects yourself.

## Scenario
A café till with one UI built twice: `src/components/ReduxCart.jsx` and
`src/components/ZustandCart.jsx`. Neither store exists yet, and the buttons
do nothing. `src/cartMath.js` has helpers for counting and totalling, and
`src/main.jsx` already wraps the app in a Redux `<Provider>`. A cart item is
`{ id, name, price, qty }`.

## Goal
**Redux Toolkit** (`src/redux/`)
1. `cartSlice.js`: a slice named `cart` with state `{ items: [] }` and
   reducers `addItem(product)` (adds with `qty: 1`, or bumps `qty`),
   `removeItem(id)` and `clear()`. Export the three actions, the reducer as
   the default export, and the selectors `selectItemCount` and `selectTotal`
   (they take the root state).
2. `store.js`: `makeStore()` returns a new `configureStore` store with the
   cart reducer under the key `cart`.
3. `ReduxCart.jsx`: read from the store with `useSelector`, and make the
   buttons `dispatch` the actions.

**Zustand** (`src/zustand/`)
4. `useCartStore.js`: export `useCartStore` holding `items` plus the
   `addItem`, `removeItem` and `clear` actions, with the same behaviour.
5. `ZustandCart.jsx`: use the store hook. No provider needed.

Both carts must show `Items: N` and `Total: £X.XX`. Run `npm run dev` and
compare the two side by side.

## Hints
- In a slice reducer, `action.payload` is whatever you passed to the action
  creator: `addItem(product)` gives `action.payload === product`.
- In Zustand, `set((state) => ({ items: [...] }))` merges the returned object
  into the state.
- Select single values from Zustand (`useCartStore((s) => s.items)`). A
  selector that builds a new object on every call, like `(s) => ({ a: s.a })`,
  makes it re-render forever unless you wrap it in `useShallow`.
- Redux DevTools (a browser extension) works with `configureStore` out of the
  box. Try it on the dev server.

## Check your work
```
./onboard validate react/04
```
