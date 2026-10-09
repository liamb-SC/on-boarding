// Plain fetch helpers. Neither library fetches for you: you hand them a
// function that returns a promise, and they handle caching, loading and
// error state, deduping and refetching around it.

// GET some JSON, and throw on a non-2xx status (fetch itself doesn't).
export async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed with ${res.status}`);
  return res.json();
}

// POST a new user; resolves to the created user.
export async function createUser(name) {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`POST /api/users failed with ${res.status}`);
  return res.json();
}
