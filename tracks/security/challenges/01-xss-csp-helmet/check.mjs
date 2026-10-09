import { check, expect, fromSandbox, watchdog } from '../../../../lib/checks.mjs';
import { listen } from '../../security-checks.mjs';

watchdog();

const { escapeHtml } = await fromSandbox('./html.js');
await check('escapeHtml escapes & < > " and \'', () => {
  const got = escapeHtml(`<a title="x" class='y'>Tom & Jerry</a>`);
  const want = /^&lt;a title=&quot;x&quot; class=(&#39;|&#x27;)y(&#39;|&#x27;)&gt;Tom &amp; Jerry&lt;\/a&gt;$/;
  expect(want.test(got), `got ${got}`);
});
await check('escapeHtml("<") is exactly &lt; (replace & first, or it gets double-escaped)', () => {
  const got = escapeHtml('<');
  expect(got === '&lt;', `escapeHtml('<') should be &lt;, got ${got}`);
});
await check('escapeHtml accepts non-strings (numbers, undefined)', () => {
  expect(escapeHtml(42) === '42', `escapeHtml(42) gave ${escapeHtml(42)}`);
});

let server;
const started = await check('app.js exports createApp() and the app starts', async () => {
  const { createApp } = await fromSandbox('./app.js');
  server = await listen(createApp());
});
if (!started) process.exit(1);
const get = (p) => fetch(server.url + p);

// Stored XSS: a guest signs the book with a payload, then anyone who views it runs it.
await fetch(`${server.url}/entries`, {
  method: 'POST',
  redirect: 'manual',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ name: '<img src=x onerror=alert(1)>', message: "<script>alert('pwned')</script>" }),
});
const home = await get('/');
const html = await home.text();

await check('stored XSS: a <script> in a message is shown as text, not run', () => {
  expect(!html.includes("<script>alert('pwned')"), 'the raw <script> payload is in the page');
  expect(html.includes('&lt;script&gt;'), 'expected the payload to appear escaped (&lt;script&gt;)');
});
await check('stored XSS: an <img onerror> in a name is shown as text', () => {
  expect(!html.includes('<img src=x'), 'the raw <img onerror> payload is in the page');
});

const reflected = await (await get(`/?q=${encodeURIComponent('"><svg onload=alert(1)>')}`)).text();
await check('reflected XSS: ?q= can\'t break out of the value="..." attribute', () => {
  expect(!reflected.includes('"><svg'), 'the quote closed the attribute and injected <svg>');
  expect(!reflected.includes('<svg'), 'a raw <svg> tag made it into the page');
});

const csp = home.headers.get('content-security-policy') ?? '';
const directive = (name) => csp.split(';').map((d) => d.trim()).find((d) => d.split(/\s+/)[0] === name);
await check('a Content-Security-Policy header is set', () => expect(csp, 'no Content-Security-Policy header'));
await check('CSP only allows scripts from \'self\' (no \'unsafe-inline\')', () => {
  const scripts = directive('script-src') ?? directive('default-src');
  expect(scripts, 'no script-src (or default-src) directive');
  expect(scripts.includes("'self'"), `script policy is "${scripts}"`);
  expect(!scripts.includes("'unsafe-inline'") && !scripts.includes('*'), `script policy is too loose: "${scripts}"`);
});
await check('CSP blocks plugins (object-src \'none\')', () =>
  expect(/'none'/.test(directive('object-src') ?? ''), 'add object-src \'none\''));

await check('the page has no inline <script> blocks', () => {
  const inline = [...html.matchAll(/<script\b([^>]*)>/gi)].filter((m) => !/\bsrc\s*=/.test(m[1]));
  expect(inline.length === 0, `${inline.length} inline <script> tag(s): the CSP would block them`);
});
await check('the page has no inline event handlers (onclick=...)', () => {
  expect(!/<[a-z][^>]*\son[a-z]+\s*=/i.test(html), 'found an on*="..." attribute: move it to public/app.js');
});
await check('the page loads /app.js, which wires up the Clear button', async () => {
  expect(/<script[^>]*\bsrc=["']?\/app\.js/i.test(html), 'no <script src="/app.js"> in the page');
  const js = await get('/app.js');
  expect(js.ok, `GET /app.js returned ${js.status}`);
  expect(/addEventListener\(\s*['"]click/.test(await js.text()), 'public/app.js should addEventListener(\'click\', ...)');
});

await check('X-Content-Type-Options: nosniff', () =>
  expect(home.headers.get('x-content-type-options') === 'nosniff', 'missing nosniff'));
await check('the page can\'t be framed (X-Frame-Options or frame-ancestors)', () =>
  expect(home.headers.get('x-frame-options') || directive('frame-ancestors'), 'no clickjacking protection'));
await check('X-Powered-By is gone (don\'t advertise Express)', () =>
  expect(!home.headers.has('x-powered-by'), `X-Powered-By: ${home.headers.get('x-powered-by')}`));

await server.close();
