import { fetchJson } from '../api.js';

// GET /api/users with SWR, keyed by the URL.
//   while loading: <p>Loading users...</p>
//   on error:      <p>Could not load users</p>
//   then:          <ul> with an <li> per user's name
export default function UsersSWR() {
  // TODO: useSWR
  return <p>Loading users...</p>;
}
