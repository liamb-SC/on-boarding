// Helpers shared by the gRPC track's check.mjs validators.
import { expect, fromSandbox } from '../../lib/checks.mjs';

export const { default: grpc } = await fromSandbox('@grpc/grpc-js');
export const { default: protoLoader } = await fromSandbox('@grpc/proto-loader');

const LOADER_OPTS = { keepCase: true, longs: String, enums: String, defaults: true };

// The Library service as described by a .proto file. Throws a readable error
// if the file doesn't parse or doesn't define library.v1.Library.
export function loadLibrary(protoPath) {
  const definition = protoLoader.loadSync(protoPath, LOADER_OPTS);
  const Library = grpc.loadPackageDefinition(definition).library?.v1?.Library;
  expect(Library, 'no `service Library` in `package library.v1`');
  return Library;
}

// Describe one rpc: 'unary' | 'server-stream' | 'client-stream' | 'bidi', with message types.
export function rpcShape(Library, method) {
  const rpc = Library.service[method];
  expect(rpc, `the Library service has no rpc ${method}`);
  const kind = rpc.requestStream
    ? (rpc.responseStream ? 'bidi' : 'client-stream')
    : (rpc.responseStream ? 'server-stream' : 'unary');
  const name = (t) => t.type?.name;
  return { kind, request: name(rpc.requestType), response: name(rpc.responseType) };
}

// Bind a grpc.Server on a free local port; returns { address, stop }.
export async function listen(server) {
  const port = await new Promise((resolve, reject) =>
    server.bindAsync('127.0.0.1:0', grpc.ServerCredentials.createInsecure(), (err, p) => (err ? reject(err) : resolve(p))));
  return { address: `127.0.0.1:${port}`, stop: () => server.forceShutdown() };
}

export function connect(Library, address) {
  return new Library(address, grpc.credentials.createInsecure());
}

const deadline = () => ({ deadline: Date.now() + 3000 });

export function unary(client, method, request, metadata = new grpc.Metadata()) {
  return new Promise((resolve, reject) =>
    client[method](request, metadata, deadline(), (err, res) => (err ? reject(err) : resolve(res))));
}

export function serverStream(client, method, request, metadata = new grpc.Metadata()) {
  return new Promise((resolve, reject) => {
    const messages = [];
    const stream = client[method](request, metadata, deadline());
    stream.on('data', (m) => messages.push(m));
    stream.on('error', reject);
    stream.on('end', () => resolve(messages));
  });
}

export function clientStream(client, method, requests, metadata = new grpc.Metadata()) {
  return new Promise((resolve, reject) => {
    const call = client[method](metadata, deadline(), (err, res) => (err ? reject(err) : resolve(res)));
    for (const r of requests) call.write(r);
    call.end();
  });
}

// Await a call that must fail with a specific status code; returns the error.
export async function expectStatus(promise, codeName) {
  let result;
  try {
    result = await promise;
  } catch (err) {
    const got = grpc.status[err.code] ?? err.code;
    expect(got === codeName, `expected status ${codeName}, got ${got}${err.details ? ` ("${err.details}")` : ''}`);
    return err;
  }
  throw new Error(`expected status ${codeName}, but the call succeeded with ${JSON.stringify(result)}`);
}
