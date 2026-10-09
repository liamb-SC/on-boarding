# 05 · Data fetching: SWR and TanStack Query

**Skills:** server state vs client state, `useSWR`, `useQuery` and query
keys, loading and error states, request deduplication, `useMutation` and
cache invalidation.

## Background
Data from a server isn't really *your* state. It's a cached copy that can go
stale. Doing it by hand with `useEffect` + `fetch` + `useState` means
re-writing loading flags, error handling, caching, deduping and refetching in
every component. Two libraries do it for you, and both take **a key** (what
the data is) and **a fetcher** (a function returning a promise):

```jsx
// SWR ("stale-while-revalidate"): the key is usually the URL
const { data, error, isLoading } = useSWR('/api/users', fetchJson);

// TanStack Query: an array key + a query function
const { data, isPending, isError } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetchJson('/api/users'),
});
```

- Every component using the same key shares **one cache entry and one
  request**.
- Both refetch in the background (e.g. when the window regains focus), so
  you show cached data instantly and update it quietly.
- To change data, TanStack Query has **mutations**: `useMutation({
  mutationFn, onSuccess })`. After a successful write you **invalidate** the
  affected keys (`queryClient.invalidateQueries({ queryKey: ['users'] })`),
  and every query using them refetches. SWR's equivalent is `mutate(key)`.

SWR is tiny and simple. TanStack Query is bigger, with mutations, devtools,
pagination and fine-grained cache control. You'll meet both.

## Scenario
A user directory. `src/api.js` has the fetch helpers. The list is shown twice,
once per library, and `AddUser` adds people. `npm run dev` starts a fake,
deliberately slow `/api/users` (see `vite.config.js`), and `src/main.jsx`
already provides a `QueryClient`.

## Goal
1. **`UsersSWR`**: fetch `/api/users` with `useSWR`, using the URL as the key
   and `fetchJson` as the fetcher.
2. **`UsersQuery`**: fetch the same list with `useQuery` under the key
   `['users']`.
3. Both show `<p>Loading users...</p>` while loading, then a `<ul>` with one
   `<li>` per user's name. On a failed request they show
   `<p>Could not load users</p>`.
4. **`AddUser`**: submit the name with `useMutation` (`createUser` from
   `api.js`). Disable the button while it's pending. On success, clear the
   input and invalidate `['users']` so the list refetches.

## Hints
- `useQueryClient()` gives you the client from the provider. Don't create a
  new `QueryClient` inside a component.
- `isLoading` (SWR) and `isPending` (TanStack) are true until the first data
  arrives.
- Open the browser's Network tab on the dev server and watch what happens
  when you add a user. Then render `<UsersQuery />` twice in `App.jsx`: you
  still get one request.

## Check your work
```
./onboard validate react/05
```
