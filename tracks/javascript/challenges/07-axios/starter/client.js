import axios from 'axios';

// 1. Return an axios INSTANCE for the books API:
//    - baseURL and a timeout of 1000ms
//    - a REQUEST interceptor that adds `Authorization: Bearer <token>`
//    - a RESPONSE interceptor that unwraps the body, so `await client.get('/books')`
//      resolves straight to the array instead of a { data, status, ... } response
export function createClient({ baseURL, token }) {
  throw new Error('TODO: createClient');
}

// 2. Fetch one book. Resolve to the book, or to null if the API says 404.
//    Any other failure must still reject.
export async function getBook(client, id) {
  const res = await axios.get(`http://localhost:3000/books/${id}?token=secret-token`);
  return res.data;
}

// 3. Describe a failed request in a few words, for logs:
//    'timeout'          the request took longer than the client's timeout
//    'http <status>'    the server answered with an error status, e.g. 'http 401'
//    'network'          no answer at all (e.g. connection refused)
//    'unknown'          not an axios error
export function describeError(err) {
  return String(err);
}
