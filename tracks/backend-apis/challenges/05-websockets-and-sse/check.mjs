import { check, expect, expectEqual, fromSandbox, watchdog } from '../../../../lib/checks.mjs';
import { listen, request } from '../../http-checks.mjs';

watchdog();
const { default: WebSocket } = await fromSandbox('ws'); // CommonJS: the class is the default export
const { createServer } = await fromSandbox('./server.js');
const api = await listen(createServer());
const wsUrl = api.url.replace('http', 'ws') + '/ws';
const post = (text) => request(`${api.url}/messages`, { method: 'POST', json: { text } });

// An SSE client: parses "field: value" lines into events, split on blank lines.
async function sse() {
  const ac = new AbortController();
  const res = await fetch(`${api.url}/events`, { signal: ac.signal });
  const events = [];
  const waiters = [];
  (async () => {
    const decoder = new TextDecoder();
    let buf = '';
    try {
      for await (const chunk of res.body) {
        buf += decoder.decode(chunk, { stream: true });
        let i;
        while ((i = buf.indexOf('\n\n')) >= 0) {
          const block = buf.slice(0, i);
          buf = buf.slice(i + 2);
          const ev = {};
          for (const line of block.split('\n')) {
            const m = /^([^:]+): ?(.*)$/.exec(line);
            if (m) ev[m[1]] = ev[m[1]] === undefined ? m[2] : `${ev[m[1]]}\n${m[2]}`;
          }
          if (ev.data !== undefined) { events.push(ev); waiters.splice(0).forEach((w) => w()); }
        }
      }
    } catch { /* aborted */ }
  })();
  const next = (pred, ms = 2000) => new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('no matching SSE event arrived within 2s')), ms);
    const look = () => {
      const ev = events.find(pred);
      if (ev) { clearTimeout(t); resolve(ev); } else waiters.push(look);
    };
    look();
  });
  return { res, next, close: () => ac.abort() };
}

// A WebSocket client that records every JSON message it receives.
function wsClient() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const msgs = [];
    const waiters = [];
    ws.on('message', (d) => {
      try { msgs.push(JSON.parse(d.toString())); } catch { msgs.push({ unparsable: d.toString() }); }
      waiters.splice(0).forEach((w) => w());
    });
    ws.on('error', reject);
    ws.on('open', () => resolve({
      ws,
      send: (x) => ws.send(typeof x === 'string' ? x : JSON.stringify(x)),
      next: (pred, ms = 2000) => new Promise((ok, fail) => {
        const t = setTimeout(() => fail(new Error(`no matching message within 2s (got ${JSON.stringify(msgs).slice(0, 120)})`)), ms);
        const look = () => {
          const m = msgs.find(pred);
          if (m) { clearTimeout(t); ok(m); } else waiters.push(look);
        };
        look();
      }),
    }));
  });
}

let stream;
await check('GET /events answers 200 with Content-Type: text/event-stream', async () => {
  stream = await sse();
  expectEqual(stream.res.status, 200, 'status: ');
  expect(/^text\/event-stream/.test(stream.res.headers.get('content-type') ?? ''), `Content-Type is ${stream.res.headers.get('content-type')}`);
});
await check('the SSE response is not cached (Cache-Control: no-cache)', () =>
  expect(/no-cache/.test(stream?.res.headers.get('cache-control') ?? ''), `Cache-Control is ${stream?.res.headers.get('cache-control')}`));
await check('POST /messages reaches SSE clients as an event with id, event: message and JSON data', async () => {
  const r = await post('hello sse');
  expectEqual(r.status, 201, 'POST status: ');
  const ev = await stream.next((e) => e.data.includes('hello sse'));
  expectEqual(ev.event, 'message', 'event: ');
  expectEqual(ev.id, String(r.body.id), 'id: ');
  expectEqual(JSON.parse(ev.data), { type: 'message', id: r.body.id, text: 'hello sse' }, 'data: ');
});

let a, b;
await check('a WebSocket client can connect to /ws and gets { "type": "welcome" }', async () => {
  a = await wsClient();
  b = await wsClient();
  await a.next((m) => m.type === 'welcome');
});
await check('a WebSocket message is broadcast to the other WebSocket clients', async () => {
  a.send({ text: 'hi from ws' });
  await b.next((m) => m.type === 'message' && m.text === 'hi from ws');
});
await check('...and to SSE clients too', async () => {
  await stream.next((e) => e.data.includes('hi from ws'));
});
await check('POST /messages reaches WebSocket clients', async () => {
  await post('hello ws');
  await a.next((m) => m.type === 'message' && m.text === 'hello ws');
});
await check('invalid JSON over the socket gets { "type": "error" } back, and the socket stays usable', async () => {
  a.send('this is not json');
  await a.next((m) => m.type === 'error');
  expectEqual(a.ws.readyState, WebSocket.OPEN, 'readyState: ');
  a.send({ text: 'still here' });
  await b.next((m) => m.text === 'still here');
});
await check('a disconnected SSE client doesn\'t break broadcasting', async () => {
  const other = await sse();
  stream.close();
  await new Promise((r) => setTimeout(r, 100));
  const r = await post('after disconnect');
  expectEqual(r.status, 201, 'POST status: ');
  await other.next((e) => e.data.includes('after disconnect'));
  other.close();
});

a?.ws.terminate();
b?.ws.terminate();
await api.close();
