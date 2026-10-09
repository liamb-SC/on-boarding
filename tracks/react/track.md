# Track: React

Building UIs with React 19: components and hooks, routing, shared state,
server data, forms, component libraries, and finally Next.js with server
and client components.

## Requirements
Node.js 20.9+ and network access to the npm registry. Each challenge's setup
installs React, Vite (`npm run dev`) and the test tools the validator uses
(Vitest, jsdom, Testing Library), plus that challenge's libraries.

## Learning objectives
By the end you can:
- Write function components that take props, render lists with keys, and pass callbacks and `children`.
- Use `useState` and `useEffect` correctly (functional updates, dependencies, cleanup) and extract custom hooks.
- Route a single-page app with React Router: nested layouts, URL params, links and navigation.
- Hold shared state in Redux Toolkit or Zustand, and explain the trade-offs.
- Fetch and mutate server data with SWR and TanStack Query, including loading/error states and cache invalidation.
- Build validated forms with React Hook Form and a Yup schema (and know where Zod fits).
- Tell an installed component library (MUI) from copied-in components (shadcn/ui), and customise each.
- Use the Next.js app router: pages, layouts, route handlers, and the server/client component split.

## Challenges (do them in order)
| # | Challenge | Core concepts |
|---|-----------|---------------|
| 01 | components-and-props | JSX, props, defaults, `children`, conditional rendering, lists and `key`, callbacks |
| 02 | hooks | `useState`, functional updates, `useEffect` + cleanup, custom hooks (debounce, document title) |
| 03 | routing | React Router: `<Routes>`, layout routes + `<Outlet>`, `useParams`, `Link`/`NavLink`, `useNavigate` |
| 04 | state-management | Redux Toolkit (`createSlice`, `configureStore`, selectors) vs Zustand (`create`), side by side |
| 05 | data-fetching | `useSWR`, TanStack `useQuery`/`useMutation`, query keys, dedupe, `invalidateQueries` |
| 06 | forms | React Hook Form, Yup schemas + `yupResolver`, cross-field rules, accessible errors; Zod |
| 07 | component-libraries | shadcn/ui's copy-in model (`cva`, `cn`), MUI components and theming |
| 08 | nextjs | app router files, route handlers, Server vs Client Components, `next build` |

Every sandbox (except 08, which uses `next dev`) has `npm run dev`, a Vite
dev server, so you can see your work in the browser. Each challenge's tests
live in its `spec.test.jsx` in this repo. The validator copies them into the
sandbox and runs them with Vitest, so you can read them but not change them.

Start with: `./onboard start react/01`
