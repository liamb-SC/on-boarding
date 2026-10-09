// A tiny gRPC command-line client for poking at the server (like grpcurl):
//   npm run call -- GetBook '{"id":"1"}'
//   npm run call -- ListBooks '{"author":"Terry Pratchett"}'     (server stream)
//   npm run call -- AddBooks '[{"title":"A"},{"title":"B"}]'     (client stream)
// Set LIBRARY_ADDR to point somewhere other than localhost:50051, and
// LIBRARY_TOKEN to send an authorization header.
import { fileURLToPath } from 'node:url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const PROTO = fileURLToPath(new URL('./proto/library.proto', import.meta.url));
const definition = protoLoader.loadSync(PROTO, { keepCase: true, longs: String, enums: String, defaults: true });
const Library = grpc.loadPackageDefinition(definition).library?.v1?.Library;
if (!Library) {
  console.error('No service library.v1.Library in proto/library.proto yet.');
  process.exit(1);
}

const [method, json = '{}'] = process.argv.slice(2);
const rpc = Library.service[method];
if (!rpc) {
  console.error(`usage: npm run call -- <method> '<json>'\nmethods: ${Object.keys(Library.service).join(', ')}`);
  process.exit(1);
}

const client = new Library(process.env.LIBRARY_ADDR ?? 'localhost:50051', grpc.credentials.createInsecure());
const metadata = new grpc.Metadata();
if (process.env.LIBRARY_TOKEN) metadata.set('authorization', `Bearer ${process.env.LIBRARY_TOKEN}`);
const input = JSON.parse(json);
const fail = (err) => {
  console.error(`✗ ${grpc.status[err.code]} (${err.code}): ${err.details}`);
  process.exit(1);
};
const done = (err, res) => (err ? fail(err) : (console.log(JSON.stringify(res, null, 2)), client.close()));

if (rpc.responseStream) {
  const stream = client[method](input, metadata);
  stream.on('data', (msg) => console.log(JSON.stringify(msg)));
  stream.on('error', fail);
  stream.on('end', () => { console.log('(stream ended)'); client.close(); });
} else if (rpc.requestStream) {
  const call = client[method](metadata, done);
  for (const msg of [].concat(input)) call.write(msg);
  call.end();
} else {
  client[method](input, metadata, done);
}
