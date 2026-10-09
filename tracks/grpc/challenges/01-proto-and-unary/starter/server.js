import { fileURLToPath } from 'node:url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { books } from './data.js';

// The server loads the same .proto the clients use: it's the shared contract.
const PROTO = fileURLToPath(new URL('./proto/library.proto', import.meta.url));
const definition = protoLoader.loadSync(PROTO, { keepCase: true, longs: String, enums: String, defaults: true });
const { library } = grpc.loadPackageDefinition(definition);

// One handler per rpc. A unary handler gets the request as call.request and
// replies once through callback(error, response).
const handlers = {
  GetBook(call, callback) {
    // TODO 3: look the book up by call.request.id and return it with callback(null, book).
    //   - empty id       -> callback({ code: grpc.status.INVALID_ARGUMENT, message: '...' })
    //   - no such book   -> callback({ code: grpc.status.NOT_FOUND, message: '...' })
    callback({ code: grpc.status.UNIMPLEMENTED, message: 'GetBook is not implemented yet' });
  },
};

export function createServer() {
  const server = new grpc.Server();
  server.addService(library.v1.Library.service, handlers);
  return server;
}

// `npm start` runs this file directly and listens on port 50051.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const address = process.env.LIBRARY_ADDR ?? '0.0.0.0:50051';
  createServer().bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) throw err;
    console.log(`Library gRPC server listening on port ${port}`);
  });
}
