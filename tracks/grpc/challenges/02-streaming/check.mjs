import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { clientStream, connect, listen, loadLibrary, rpcShape, serverStream, unary } from '../../grpc-checks.mjs';

watchdog();
const HERE = path.dirname(fileURLToPath(import.meta.url));

let Library;
await check('proto/library.proto defines service library.v1.Library', () => {
  Library = loadLibrary(path.join(SANDBOX, 'proto/library.proto'));
});
await check('ListBooks is server streaming: ListBooksRequest -> stream Book', () => {
  expectEqual(rpcShape(Library, 'ListBooks'), { kind: 'server-stream', request: 'ListBooksRequest', response: 'Book' });
});
await check('AddBooks is client streaming: stream Book -> AddBooksSummary', () => {
  expectEqual(rpcShape(Library, 'AddBooks'), { kind: 'client-stream', request: 'Book', response: 'AddBooksSummary' });
});

let server;
const started = await check('server.js starts with your service', async () => {
  const { createServer } = await fromSandbox('./server.js');
  server = await listen(createServer());
});
if (!started) process.exit(1);

const client = connect(loadLibrary(path.join(HERE, 'contract.proto')), server.address);
const titles = (books) => books.map((b) => b.title);

await check('GetBook still works', async () => {
  expectEqual((await unary(client, 'GetBook', { id: '2' })).title, 'The Left Hand of Darkness');
});
await check('ListBooks {} streams every book, in order, then ends', async () => {
  expectEqual((await serverStream(client, 'ListBooks', {})).map((b) => b.id), ['1', '2', '3', '4', '5']);
});
await check('ListBooks {author: "Terry Pratchett"} streams only his books', async () => {
  expectEqual(titles(await serverStream(client, 'ListBooks', { author: 'Terry Pratchett' })),
    ['Guards! Guards!', 'Small Gods']);
});
await check('ListBooks for an author with no books ends cleanly with zero messages', async () => {
  expectEqual(await serverStream(client, 'ListBooks', { author: 'Nobody' }), []);
});

const jemisin = [
  { title: 'The Fifth Season', author: 'N. K. Jemisin', year: 2015 },
  { title: 'The Obelisk Gate', author: 'N. K. Jemisin', year: 2016 },
];
await check('AddBooks with 2 streamed books replies {added: 2, ids: ["6", "7"]}', async () => {
  expectEqual(await clientStream(client, 'AddBooks', jemisin), { added: 2, ids: ['6', '7'] });
});
await check('the added books are saved (ListBooks and GetBook find them)', async () => {
  expectEqual(titles(await serverStream(client, 'ListBooks', { author: 'N. K. Jemisin' })),
    ['The Fifth Season', 'The Obelisk Gate']);
  expectEqual(await unary(client, 'GetBook', { id: '7' }), { id: '7', ...jemisin[1] });
});

client.close();
server.stop();
