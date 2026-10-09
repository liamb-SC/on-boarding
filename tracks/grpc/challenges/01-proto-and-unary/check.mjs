import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { connect, expectStatus, listen, loadLibrary, rpcShape, unary } from '../../grpc-checks.mjs';

watchdog();
const HERE = path.dirname(fileURLToPath(import.meta.url));

let Library;
await check('proto/library.proto defines service library.v1.Library', () => {
  Library = loadLibrary(path.join(SANDBOX, 'proto/library.proto'));
});
await check('GetBook is a unary rpc: GetBookRequest -> Book', () => {
  expectEqual(rpcShape(Library, 'GetBook'), { kind: 'unary', request: 'GetBookRequest', response: 'Book' });
});

let server;
const started = await check('server.js starts with your service', async () => {
  const { createServer } = await fromSandbox('./server.js');
  server = await listen(createServer());
});
if (!started) process.exit(1);

// Call it the way an existing client would: built from the agreed contract,
// not your proto. If your field numbers differ, the bytes won't line up.
const client = connect(loadLibrary(path.join(HERE, 'contract.proto')), server.address);

await check('GetBook {id: "1"} returns A Wizard of Earthsea', async () => {
  expectEqual(await unary(client, 'GetBook', { id: '1' }),
    { id: '1', title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', year: 1968 });
});
await check('GetBook {id: "3"} returns Guards! Guards! (a contract-built client understands you)', async () => {
  expectEqual(await unary(client, 'GetBook', { id: '3' }),
    { id: '3', title: 'Guards! Guards!', author: 'Terry Pratchett', year: 1989 });
});
await check('an unknown id fails with status NOT_FOUND', () =>
  expectStatus(unary(client, 'GetBook', { id: '999' }), 'NOT_FOUND'));
await check('an empty id fails with status INVALID_ARGUMENT', () =>
  expectStatus(unary(client, 'GetBook', { id: '' }), 'INVALID_ARGUMENT'));

client.close();
server.stop();
