import { fileURLToPath } from 'node:url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import { books } from './data.js';

const PROTO = fileURLToPath(new URL('./proto/library.proto', import.meta.url));
const definition = protoLoader.loadSync(PROTO, { keepCase: true, longs: String, enums: String, defaults: true });
const { library } = grpc.loadPackageDefinition(definition);

const handlers = {
  GetBook(call, callback) {
    const { id } = call.request;
    if (!id) return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'id is required' });
    const book = books.find((b) => b.id === id);
    if (!book) return callback({ code: grpc.status.NOT_FOUND, message: `no book with id ${id}` });
    callback(null, book);
  },

  // Server streaming: there's no callback. Send any number of messages with
  // call.write(msg), then finish with call.end().
  ListBooks(call) {
    // TODO 5: stream every book whose author matches call.request.author
    //         (or every book if it's empty), then end the stream.
    call.emit('error', { code: grpc.status.UNIMPLEMENTED, details: 'ListBooks is not implemented yet' });
  },

  // Client streaming: messages arrive as 'data' events. When the client is
  // done, 'end' fires, and you reply once with callback(null, response).
  AddBooks(call, callback) {
    // TODO 6: save each incoming book with a new id ("6", "7", ...) and reply
    //         with how many were added and their ids.
    callback({ code: grpc.status.UNIMPLEMENTED, message: 'AddBooks is not implemented yet' });
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
