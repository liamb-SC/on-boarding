// A client for the shared cache server (cache-server.js), which every app
// instance talks to. It has the same interface as local-cache.js.
//   GET    <url>/kv/<key>   -> 200 { value } | 404
//   PUT    <url>/kv/<key>   body { value } -> 204
//   DELETE <url>/kv/<key>   -> 204
export function createSharedCache(url = process.env.CACHE_URL ?? 'http://127.0.0.1:6380') {
  return {
    // TODO: return the value, or undefined on a 404
    async get(key) {},
    // TODO
    async set(key, value) {},
    // TODO
    async del(key) {},
  };
}
