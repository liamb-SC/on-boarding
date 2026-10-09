import { fileURLToPath } from 'node:url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const PROTO = fileURLToPath(new URL('./proto/library.proto', import.meta.url));
const definition = protoLoader.loadSync(PROTO, { keepCase: true, longs: String, enums: String, defaults: true });
const { library } = grpc.loadPackageDefinition(definition);

// The validator runs this file with LIBRARY_ADDR pointing at its own server.
const client = new library.v1.Library(
  process.env.LIBRARY_ADDR ?? 'localhost:50051',
  grpc.credentials.createInsecure(),
);

// The server wants this on every call, sent as metadata:
//   authorization: Bearer onboarding-token
const TOKEN = 'onboarding-token';

// TODO 1: GetBook for id "3" (with the auth metadata), then print:
//           Book: <title>
//
// TODO 2: ListBooks for author "Ursula K. Le Guin", count the streamed books, then print:
//           Books by Ursula K. Le Guin: <count>
//
// TODO 3: GenerateReport with a 1-second deadline. It takes ~3s, so the call
//         should fail with DEADLINE_EXCEEDED. When it does, print:
//           Report: timed out
//         (If it succeeds, print "Report: <summary>". Any other error: throw it.)

client.close(); // let the process exit once you're done
