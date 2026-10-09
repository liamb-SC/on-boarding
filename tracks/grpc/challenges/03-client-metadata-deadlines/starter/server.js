import { fileURLToPath } from 'node:url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { books } from './data.js';
import { createLibraryHandlers } from './library-service.js';

const PROTO = fileURLToPath(new URL('./proto/library.proto', import.meta.url));
const definition = protoLoader.loadSync(PROTO, { keepCase: true, longs: String, enums: String, defaults: true });
const { library } = grpc.loadPackageDefinition(definition);

const address = process.env.LIBRARY_ADDR ?? '0.0.0.0:50051';
const server = new grpc.Server();
server.addService(library.v1.Library.service, createLibraryHandlers({
  grpc,
  books,
  onCall: ({ method, authorization }) => console.log(`${method}  authorization=${authorization ?? '(none)'}`),
}));
server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) throw err;
  console.log(`Library gRPC server listening on port ${port}`);
});
