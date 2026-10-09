// A thin wrapper around fetch. Tests should never hit the real network, so
// mock this whole module with vi.mock('../src/http.js').
export async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}
