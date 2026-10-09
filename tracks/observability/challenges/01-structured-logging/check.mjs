import { check, expect, expectEqual, fromSandbox, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const { createLogger } = await fromSandbox('./logger.js');
const { placeOrder } = await fromSandbox('./checkout.js');

const CARD = '4242424242424242';
const DECLINED = '4000000000000002';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LEVEL = { debug: 20, info: 30, warn: 40, error: 50 };

// A logger whose output we keep: raw text plus parsed lines.
function capture(level) {
  if (level) process.env.LOG_LEVEL = level; else delete process.env.LOG_LEVEL;
  const out = { raw: '', lines: [] };
  out.logger = createLogger({ write(s) { out.raw += s; out.lines.push(JSON.parse(s)); } });
  return out;
}
// Run one request, failing if it reaches for console.log instead of the logger.
async function run(out, req) {
  const original = { log: console.log, error: console.error, info: console.info };
  const used = [];
  console.log = console.error = console.info = (...a) => used.push(a.join(' '));
  const before = out.lines.length;
  try {
    const res = await placeOrder(out.logger, req);
    return { res, lines: out.lines.slice(before), consoleUsed: used };
  } finally {
    Object.assign(console, original);
  }
}
const order = (headers = {}, items = [{ sku: 'mug', price: 899 }, { sku: 'tee', price: 1599 }], number = CARD) =>
  ({ headers, body: { items, card: { number, expiry: '12/30' } } });

await check('logger.js: every line is JSON with service: "checkout"', () => {
  const out = capture();
  out.logger.info('hello');
  expect(out.lines.length === 1, 'nothing was logged');
  expectEqual(out.lines[0].service, 'checkout', 'service: ');
});
await check('logger.js: level comes from LOG_LEVEL, defaulting to info', () => {
  const def = capture(); def.logger.debug('d'); def.logger.info('i');
  expect(def.lines.length === 1, 'with no LOG_LEVEL, debug lines should be dropped and info kept');
  const dbg = capture('debug'); dbg.logger.debug('d');
  expect(dbg.lines.length === 1, 'LOG_LEVEL=debug should let debug lines through');
  const warn = capture('warn'); warn.logger.info('i');
  expect(warn.lines.length === 0, 'LOG_LEVEL=warn should drop info lines');
});
await check('logger.js: card.number is redacted', () => {
  const out = capture();
  out.logger.info({ card: { number: CARD, expiry: '12/30' } }, 'card details');
  expect(out.lines.length === 1, 'nothing was logged to the destination passed to createLogger');
  expect(!out.raw.includes(CARD), 'the card number appeared in the output');
});

const ok = await run(capture(), order({ 'x-request-id': 'req-abc' }));
await check('placeOrder logs through the logger, not console.log', () =>
  expect(ok.consoleUsed.length === 0 && ok.lines.length > 0, `console was used: ${ok.consoleUsed[0] ?? '(and nothing reached the logger)'}`));
await check('success: an info line "order placed" with orderId and total as fields', () => {
  const line = ok.lines.find((l) => l.level === LEVEL.info && l.orderId);
  expect(line, 'no info-level line with an orderId field');
  expectEqual(line.total, 2498, 'total: ');
  expect(!String(line.msg).includes(line.orderId), `msg should be a fixed string, with values in fields (got "${line.msg}")`);
});
await check('an incoming x-request-id header is on every line as requestId', () =>
  expect(ok.lines.length && ok.lines.every((l) => l.requestId === 'req-abc'),
    `requestIds: ${JSON.stringify(ok.lines.map((l) => l.requestId))}`));
await check('...and is echoed back in the response x-request-id header', () =>
  expectEqual(ok.res.headers?.['x-request-id'], 'req-abc', 'response header: '));

const a = await run(capture(), order());
const b = await run(capture(), order());
await check('no header: a UUID requestId is generated, used on every line and returned', () => {
  const id = a.res.headers?.['x-request-id'];
  expect(UUID.test(id ?? ''), `response x-request-id is ${JSON.stringify(id)}`);
  expect(a.lines.every((l) => l.requestId === id), 'every log line should carry that same requestId');
  expect(b.res.headers?.['x-request-id'] !== id, 'two requests got the same id');
});

await check('LOG_LEVEL=debug shows extra debug detail for a request (and the default hides it)', async () => {
  const dbg = await run(capture('debug'), order());
  expect(dbg.lines.some((l) => l.level === LEVEL.debug), 'no debug-level line when LOG_LEVEL=debug');
  expect(!a.lines.some((l) => l.level === LEVEL.debug), 'debug lines leaked at the default level');
});

const empty = await run(capture(), order({}, []));
await check('empty cart: 400, with a warn-level line and the requestId', () => {
  expectEqual(empty.res.status, 400, 'status: ');
  expect(empty.lines.some((l) => l.level === LEVEL.warn && l.requestId), 'no warn line with a requestId');
  expect(UUID.test(empty.res.headers?.['x-request-id'] ?? ''), 'the 400 response should carry x-request-id too');
});

const failed = await run(capture(), order({ 'x-request-id': 'req-fail' }, undefined, DECLINED));
await check('payment failure: 502, with an error-level line carrying the error as `err`', () => {
  expectEqual(failed.res.status, 502, 'status: ');
  const line = failed.lines.find((l) => l.level === LEVEL.error);
  expect(line, 'no error-level line');
  expect(line.err?.message === 'card declined by issuer' && line.err?.stack,
    'log the Error object itself as { err } so pino serialises its message and stack');
  expectEqual(line.requestId, 'req-fail', 'requestId: ');
  expectEqual(failed.res.headers?.['x-request-id'], 'req-fail', 'response header: ');
});
await check('no card number appears in any request logs', () => {
  const lines = [ok, a, empty, failed].flatMap((r) => r.lines);
  expect(lines.length > 0, 'nothing reached the logger');
  const all = JSON.stringify(lines);
  expect(!all.includes(CARD) && !all.includes(DECLINED), 'a card number was logged');
});
