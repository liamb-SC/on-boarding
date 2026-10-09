import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, fromSandbox, SANDBOX, stage, watchdog } from '../../../../lib/checks.mjs';
import { grpc, listen, loadLibrary } from '../../grpc-checks.mjs';

watchdog(30000);
const HERE = path.dirname(fileURLToPath(import.meta.url));

// Validator-owned copies of the server code and data (staged into the sandbox
// so they load as ES modules), so edits to the sandbox copies don't count.
const { books } = await fromSandbox(`${stage(path.join(HERE, '../../fixtures'), 'grpc-fixtures')}/data.js`);
const { createLibraryHandlers } = await fromSandbox(`${stage(path.join(HERE, 'starter'), 'grpc-03')}/library-service.js`);

// Run the reference server (not the sandbox copy), recording every call.
const calls = [];
const Library = loadLibrary(path.join(HERE, 'starter/proto/library.proto'));
const grpcServer = new grpc.Server();
grpcServer.addService(Library.service, createLibraryHandlers({ grpc, books, onCall: (c) => calls.push(c) }));
const server = await listen(grpcServer);

const run = await new Promise((resolve) => {
  execFile(process.execPath, ['client.js'], {
    cwd: SANDBOX,
    env: { ...process.env, LIBRARY_ADDR: server.address },
    timeout: 10000,
  }, (err, stdout, stderr) => resolve({ err, stdout, stderr }));
});
server.stop();

const lines = run.stdout.split('\n').map((l) => l.trim());
const why = () => (run.stderr.trim().split('\n').find((l) => /Error|error/.test(l)) ?? run.stderr.trim().split('\n')[0] ?? '');
const callsTo = (m) => calls.filter((c) => c.method === m);

await check('node client.js runs and exits on its own (no crash, no hang)', () => {
  expect(!run.err?.killed, 'still running after 10s: did you forget client.close()?');
  expect(!run.err, `exited with an error: ${why()}`);
});

await check('every call sent "authorization: Bearer onboarding-token" metadata', () => {
  expect(calls.length > 0, 'the server received no calls');
  const bad = calls.filter((c) => c.authorization !== 'Bearer onboarding-token');
  expect(!bad.length, `${bad.map((c) => c.method).join(', ')} sent authorization=${bad[0]?.authorization ?? '(none)'}`);
});

await check('1: GetBook for id "3" → prints "Book: Guards! Guards!"', () => {
  expect(callsTo('GetBook').some((c) => c.request.id === '3'), 'no GetBook call with id "3"');
  expect(lines.includes('Book: Guards! Guards!'), 'that line is missing from the output');
});

await check('2: ListBooks streamed for Ursula K. Le Guin → prints "Books by Ursula K. Le Guin: 2"', () => {
  expect(callsTo('ListBooks').some((c) => c.request.author === 'Ursula K. Le Guin'), 'no ListBooks call for that author');
  expect(lines.includes('Books by Ursula K. Le Guin: 2'), 'that line is missing from the output');
});

await check('3: GenerateReport was called with a deadline of about 1 second', () => {
  const [report] = callsTo('GenerateReport');
  expect(report, 'GenerateReport was never called');
  expect(report.deadlineMs !== Infinity, 'no deadline set: the call would wait as long as the server takes');
  expect(report.deadlineMs <= 1500, `deadline was ${Math.round(report.deadlineMs)}ms away; expected about 1000ms`);
});

await check('3: the DEADLINE_EXCEEDED error was handled → prints "Report: timed out"', () => {
  expect(lines.includes('Report: timed out'), 'that line is missing from the output');
});
