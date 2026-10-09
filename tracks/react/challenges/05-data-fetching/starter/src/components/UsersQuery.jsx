import { fetchJson } from '../api.js';

// The same list with TanStack Query, under the query key ['users'].
//   while loading: <p>Loading users...</p>
//   on error:      <p>Could not load users</p>
//   then:          <ul> with an <li> per user's name
export default function UsersQuery() {
  // TODO: useQuery
  return <p>Loading users...</p>;
}
