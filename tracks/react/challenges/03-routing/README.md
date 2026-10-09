# 03 · Routing with React Router

**Skills:** `<Routes>`/`<Route>`, nested routes with a layout and `<Outlet>`,
index and catch-all routes, URL params (`useParams`), `<Link>`/`<NavLink>`,
navigating from code (`useNavigate`).

## Background
A single-page app has one HTML page. **React Router** maps the URL to the
components to render, and changes the URL without reloading the page:

```jsx
<Routes>
  <Route element={<Layout />}>              {/* a layout route: no path */}
    <Route index element={<Home />} />       {/* "/" exactly */}
    <Route path="users/:id" element={<User />} />
    <Route path="*" element={<NotFound />} />  {/* anything unmatched */}
  </Route>
</Routes>
```

- Nested routes render inside their parent wherever it puts `<Outlet />`.
  That's how one nav bar wraps every page.
- `useParams()` reads `:id` from the URL, so `/users/42` gives `{ id: '42' }`.
- `<Link to="/x">` navigates without a reload. A plain `<a href>` reloads the
  whole app and throws away its state. `<NavLink>` is a `Link` that knows when
  it's active and sets `aria-current="page"` (and an `active` class).
- `useNavigate()` returns a function for navigating from code, e.g. after a
  form submits.

This challenge uses React Router v7 in its simple "declarative" mode. The same
library also has a data-router mode (`createBrowserRouter`, loaders) and a
full framework mode. The concepts above carry over to both.

## Scenario
A small shop. The pages exist in `src/pages/`, but `src/AppRoutes.jsx` always
shows Home, the nav is empty, and the product links are plain `<a>` tags.
`src/main.jsx` already wraps the app in a `<BrowserRouter>`. Run `npm run dev`
and click around.

## Goal
1. **`AppRoutes`**: a layout route rendering `<Layout>`, with child routes
   for `/` → `Home`, `/products` → `Products`, `/products/:id` →
   `ProductDetail`, and anything else → `NotFound`.
2. **`Layout`**: the `<nav>` has `NavLink`s to `/` (text `Home`) and
   `/products` (text `Products`), and the current page renders in `<main>`.
3. **`Products`**: each product name links to `/products/<id>` without a
   page reload.
4. **`ProductDetail`**: shows the product for the `:id` in the URL, an
   `<h1>Product not found</h1>` for an unknown id, and a
   `Back to products` button that navigates to `/products`.

## Hints
- Import everything from `react-router` (`react-router-dom` is now just a
  re-export of it).
- `NavLink to="/"` also matches `/products`, because `/` is a prefix of it.
  Add `end` so Home is only active on `/` exactly.
- Hooks like `useParams` only work in components rendered by a route, inside
  the router.

## Check your work
```
./onboard validate react/03
```
