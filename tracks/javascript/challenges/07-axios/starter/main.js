import { createClient, describeError, getBook } from './client.js';

const baseURL = process.env.API_URL ?? 'http://127.0.0.1:3000';
const client = createClient({ baseURL, token: 'secret-token' });

console.log('books:', await client.get('/books'));
console.log('book 2:', await getBook(client, '2'));
console.log('book 99:', await getBook(client, '99'));

for (const [label, request] of [
  ['bad token', () => createClient({ baseURL, token: 'wrong' }).get('/books')],
  ['slow', () => client.get('/slow')],
  ['no server', () => createClient({ baseURL: 'http://127.0.0.1:1', token: 'x' }).get('/books')],
]) {
  try {
    await request();
    console.log(label, '-> ok?!');
  } catch (err) {
    console.log(label, '->', describeError(err));
  }
}
