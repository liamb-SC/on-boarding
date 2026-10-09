import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { JSDOM, VirtualConsole, load, read } from '../../dom.mjs';

watchdog(30000);

// ----- What the metrics mean ---------------------------------------------
let answers = {};
await check('answers.json is valid JSON', () => { answers = JSON.parse(read('answers.json')); });
const num = (key, want, desc) => check(desc, () => {
  expect(answers[key] !== null && answers[key] !== '', 'not answered yet');
  expect(Number(answers[key]) === want, `${answers[key]} is not the "good" threshold`);
});
await num('lcpGoodSeconds', 2.5, 'LCP is "good" up to how many seconds');
await num('clsGood', 0.1, 'CLS is "good" up to what score');
await num('inpGoodMs', 200, 'INP is "good" up to how many milliseconds');

const METRIC = {
  lazyHeroImage: 'LCP', imageWithoutDimensions: 'CLS', blockingScript: 'LCP', lateBanner: 'CLS', slowClickHandler: 'INP',
};
await check('each problem is matched to the metric it hurts most (LCP / CLS / INP)', () => {
  const wrong = Object.entries(METRIC).filter(([k, m]) => String(answers[k] ?? '').trim().toUpperCase() !== m);
  expect(!wrong.length, `not right yet: ${wrong.map(([k]) => k).join(', ')}`);
});

// ----- The page ----------------------------------------------------------
let doc, win;
await check('index.html and styles.css load', () => {
  ({ document: doc, window: win } = load('index.html', { css: ['styles.css'] }));
});
const hero = () => doc?.getElementById('hero');

await check('LCP: the hero image is not lazy-loaded', () => {
  expect(hero(), 'keep <img id="hero">');
  expect(hero().getAttribute('loading') !== 'lazy', 'loading="lazy" delays the biggest thing on screen');
});

await check('LCP: the hero image is fetched with high priority (fetchpriority="high")', () =>
  expect(hero()?.getAttribute('fetchpriority') === 'high', 'add fetchpriority="high"'));

await check('CLS: the hero image has width and height attributes (1200 × 600)', () => {
  const [w, h] = ['width', 'height'].map((a) => Number(hero()?.getAttribute(a)));
  expect(w > 0 && h > 0, 'add width="1200" height="600" so the browser reserves its space');
  expect(Math.abs(w / h - 2) < 0.01, `${w}×${h} is not the image's 2:1 aspect ratio`);
});

await check('LCP: analytics.js no longer blocks rendering (defer or async)', () => {
  const s = doc?.querySelector('script[src$="analytics.js"]');
  expect(s, 'keep loading analytics.js');
  expect(s.defer || s.async || s.type === 'module', 'a plain <script> in <head> stops the parser until it has downloaded and run');
});

await check('CLS: #promo reserves its space before the banner arrives (min-height in styles.css)', () => {
  const promo = doc?.getElementById('promo');
  expect(promo, 'keep <div id="promo">');
  const cs = win.getComputedStyle(promo);
  const reserved = [cs.minHeight, cs.height].map((v) => parseFloat(v) || 0);
  expect(Math.max(...reserved) >= 40, `give #promo a min-height about the banner's height (~56px), got "${cs.minHeight || cs.height || 'none'}"`);
});

// INP: run app.js in jsdom with a stand-in for heavy.js, click, and time the
// synchronous part of the handler (what delays the next paint).
await check('INP: the click updates the basket right away and does the heavy work after yielding', async () => {
  const dom = new JSDOM(read('index.html'), {
    runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: new VirtualConsole(),
  });
  const w = dom.window;
  let calls = 0;
  w.buildRecommendations = () => {
    calls += 1;
    const end = Date.now() + 150;
    while (Date.now() < end) { /* busy */ }
    return ['Trail socks', 'Spare laces', 'Ankle gaiters'];
  };
  w.scheduler ??= { yield: () => new Promise((r) => w.setTimeout(r, 0)) };
  w.eval(read('app.js'));
  const t0 = Date.now();
  w.document.getElementById('add').click();
  const blocked = Date.now() - t0;
  const text = w.document.getElementById('basket').textContent.trim();
  expect(text === '1 in basket', `right after the click the basket says "${text}": update it first`);
  expect(blocked < 50, `the click handler blocked for ${blocked}ms before the browser could paint`);
  await new Promise((r) => setTimeout(r, 600));
  expect(calls === 1, `buildRecommendations ran ${calls} times (it should still run, once)`);
  const recs = w.document.querySelectorAll('#recs li').length;
  expect(recs === 3, `the recommendations never appeared (${recs} items)`);
  w.close();
});

// ----- Measuring ---------------------------------------------------------
// Run vitals.js in Node with a fake web-vitals that reports one value per metric.
await check('vitals.js reports LCP, CLS and INP with web-vitals (onLCP, onCLS, onINP)', () => {
  const src = read('vitals.js');
  expect(src, 'vitals.js is missing');
  const dir = path.join(SANDBOX, 'node_modules', '.onboard-validator', 'vitals');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'fake-web-vitals.mjs'), `
    const fake = (name, value) => (cb, opts) => {
      if (typeof cb !== 'function') throw new Error('on' + name + ' needs a callback');
      globalThis.__seen.push(name);
      cb({ name, value, rating: 'good', delta: value, id: 'v5-test', entries: [], navigationType: 'navigate' });
    };
    globalThis.__seen = [];
    export const onLCP = fake('LCP', 1234), onCLS = fake('CLS', 0.042), onINP = fake('INP', 96);
    export const onFCP = fake('FCP', 800), onTTFB = fake('TTFB', 120);
    process.on('exit', () => console.log('__SEEN__' + globalThis.__seen.join(',')));
  `);
  writeFileSync(path.join(dir, 'vitals.mjs'), src.replace(/(['"])web-vitals(\/[^'"]*)?\1/g, "'./fake-web-vitals.mjs'"));
  const r = spawnSync('node', [path.join(dir, 'vitals.mjs')], {
    encoding: 'utf8', timeout: 10000, env: { ...process.env, NODE_OPTIONS: '' },
  });
  const out = `${r.stdout}${r.stderr}`;
  expect(r.status === 0, `vitals.js crashed: ${out.trim().split('\n').slice(-1)[0]}`);
  const seen = (out.match(/__SEEN__(.*)/)?.[1] ?? '').split(',');
  const missing = ['LCP', 'CLS', 'INP'].filter((m) => !seen.includes(m));
  expect(!missing.length, `not registered: ${missing.map((m) => `on${m}`).join(', ')}`);
  const printed = out.replace(/__SEEN__.*/, '');
  expect(/LCP/.test(printed) && /1234/.test(printed) && /CLS/.test(printed) && /0\.042/.test(printed) && /INP/.test(printed) && /96/.test(printed),
    'log each metric\'s name and value, e.g. console.log(metric.name, metric.value, metric.rating)');
});
