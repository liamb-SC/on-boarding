import { spawnSync } from 'node:child_process';
import { check, expect, SANDBOX } from '../../../../lib/checks.mjs';
import { load, read } from '../../dom.mjs';

let doc;
await check('index.html parses', () => { ({ document: doc } = load('index.html')); });
const classes = (id) => [...(doc?.getElementById(id)?.classList ?? [])];

// has(id, desc, ...rules) — each rule is [label, pattern]; the element needs a
// class matching every pattern.
const has = (id, desc, ...rules) => check(`#${id}: ${desc}`, () => {
  const list = classes(id);
  expect(doc?.getElementById(id), `keep the element with id="${id}"`);
  const missing = rules.filter(([, p]) => !list.some((c) => p.test(c))).map(([label]) => label);
  expect(!missing.length, `missing ${missing.join(', ')} (has: ${list.join(' ') || 'none'})`);
});

const COLOR = '(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}';
const GREY = '(slate|gray|zinc|neutral|stone)-\\d{2,3}';
const re = (s) => new RegExp(`^${s}$`);

await has('team', 'a grid: one column on phones, three from md up, with a gap',
  ['grid', /^grid$/], ['grid-cols-1', /^grid-cols-1$/], ['md:grid-cols-3', /^md:grid-cols-3$/], ['gap-*', /^gap-/]);
await has('card', 'a white, rounded, shadowed flex row with padding, items centred, a gap',
  ['flex', /^flex$/], ['items-center', /^items-center$/], ['gap-*', /^gap-/], ['p-*', /^p-\d/],
  ['bg-white', /^bg-white$/], ['rounded-*', /^rounded/], ['shadow-*', /^shadow/]);
await has('avatar', 'a 64px circle', ['rounded-full', /^rounded-full$/], ['size-16 (or w-16 h-16)', /^(size-16|w-16)$/]);
await has('name', 'large and bold', ['text-lg/xl/2xl', /^text-(lg|xl|2xl)$/], ['font-semibold/bold', /^font-(semibold|bold|extrabold)$/]);
await has('role', 'small and grey', ['text-sm', /^text-sm$/], ['a grey text colour like text-gray-500', re(`text-${GREY}`)]);
await has('follow', 'a coloured button pushed to the right, darker on hover',
  ['a background like bg-blue-600', re(`bg-${COLOR}`)], ['hover:bg-*', re(`hover:bg-${COLOR}`)],
  ['text-white', /^text-white$/], ['px-*', /^px-/], ['py-*', /^py-/], ['rounded-*', /^rounded/], ['ml-auto', /^ml-auto$/]);

await check('no hand-written CSS in the page (no <style>, no style="")', () => {
  expect(!doc.querySelector('style'), 'remove the <style> element: utilities only');
  expect(!doc.querySelector('[style]'), 'remove style="" attributes: utilities only');
});

await check('src/input.css imports Tailwind', () =>
  expect(/@import\s+["']tailwindcss["']/.test(read('src/input.css')), 'add @import "tailwindcss";'));

let build;
await check('`npm run build` runs the Tailwind CLI into dist/output.css', async () => {
  const script = (JSON.parse(read('package.json') || '{}').scripts ?? {}).build ?? '';
  expect(/tailwindcss/.test(script), 'add a "build" script that runs tailwindcss');
  build = spawnSync('npm', ['run', 'build', '--silent'], { cwd: SANDBOX, timeout: 60000, encoding: 'utf8' });
  const out = `${build.stdout}${build.stderr}`.trim().split('\n').slice(-2).join(' ');
  expect(build.status === 0, `the build failed: ${out}`);
});

await check('dist/output.css has the utilities your HTML uses (including md: and hover:)', () => {
  const css = read('dist/output.css');
  expect(css, 'dist/output.css was not written: check the -o path');
  for (const sel of ['.bg-white', '.rounded-full', '.md\\:grid-cols-3', '.hover\\:bg-']) {
    expect(css.includes(sel), `no ${sel.replace(/\\/g, '')} rule: does the build scan index.html?`);
  }
});

await check('it only generated what you use (no unused utilities like .grid-cols-7)', () => {
  expect(read('dist/output.css'), 'no dist/output.css yet');
  expect(!read('dist/output.css').includes('.grid-cols-7'), 'the output contains unused utilities');
});
