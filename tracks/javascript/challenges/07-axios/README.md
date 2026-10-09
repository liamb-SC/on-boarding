# 07 · HTTP clients with Axios

**Skills:** axios instances, request and response interceptors, timeouts, and
telling HTTP errors, timeouts and network failures apart.

## Background
```js
const api = axios.create({ baseURL: 'https://api.example.com', timeout: 2000 });

api.interceptors.request.use((config) => {          // runs before every request
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,                            // 2xx
  (error) => Promise.reject(error),                  // everything else
);
```
- An **instance** holds shared config, so call sites just say
  `api.get('/books')`. Never build URLs with tokens in the query string.
- **Interceptors** are middleware for every request and response: auth
  headers, request IDs, logging, unwrapping, retries.
- Axios **rejects on any non-2xx status**. The error tells you what happened:
  - `error.response` is set: the server answered, see `error.response.status`.
  - `error.code === 'ECONNABORTED'` or `'ETIMEDOUT'`: the timeout fired.
  - neither: no answer at all, e.g. connection refused or DNS failure.
  - `axios.isAxiosError(err)` tells axios errors apart from your own bugs.
- **Always set a timeout.** The default is none, so a stuck server holds your
  request open forever.

## Scenario
`server.mjs` is a small books API that needs a bearer token (`secret-token`).
`client.js` is the client you'll write.

## Goal
In `client.js`:
1. `createClient({ baseURL, token })` returns an axios **instance** with that
   `baseURL`, a `1000`ms timeout, a **request interceptor** that adds
   `Authorization: Bearer <token>`, and a **response interceptor** that
   unwraps `response.data`.
2. `getBook(client, id)` uses the client and resolves to the book, or to
   `null` on a 404. Other errors still reject.
3. `describeError(err)` returns `'timeout'`, `'http <status>'`, `'network'`
   or `'unknown'`, as described in the file.

## Try it
```bash
npm run server     # terminal 1
npm start          # terminal 2: books, book 2, book 99 -> null, then three errors
```

## Hints
- Once the response interceptor unwraps the body, `await client.get(...)`
  gives you the data directly.
- Look for a 404 on `err.response?.status` inside a `try/catch` around
  `await client.get(...)`.
- With a response interceptor in place, the error object is still the
  original axios error, as long as you don't replace it.

## Check your work
```
./onboard validate javascript/07
```
