import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, expectEqual } from '../../../../lib/checks.mjs';
import { load, read } from '../../dom.mjs';

// The validator's own copy of the markup, styled by the learner's styles.css.
const html = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'page.html'), 'utf8');
let win, doc;
await check('styles.css parses', () => {
  expect(read('styles.css'), 'styles.css is missing');
  ({ window: win, document: doc } = load('index.html', { html, css: ['styles.css'] }));
});
const style = (sel) => win.getComputedStyle(doc.querySelector(sel));
const prop = (sel, p) => style(sel).getPropertyValue(p).trim();

// ----- 1. Box model ------------------------------------------------------
let answers = {};
await check('box-model.json is valid JSON', () => { answers = JSON.parse(read('box-model.json')); });
const answer = (key, want) => () => {
  expect(answers[key] !== null && answers[key] !== undefined, 'not answered yet');
  expect(Number(String(answers[key]).replace(/px$/, '')) === want, `${answers[key]} is not right`);
};
await check('box-model: rendered width with content-box', answer('contentBoxWidth', 250));
await check('box-model: rendered width with border-box', answer('borderBoxWidth', 200));
await check('box-model: content width with border-box', answer('borderBoxContentWidth', 150));
await check('box-model: horizontal space taken with content-box, margins included', answer('contentBoxSpaceTaken', 270));

await check('every element uses box-sizing: border-box', () => {
  for (const sel of ['body', '.card', '.tile', '.site-header']) {
    expect(prop(sel, 'box-sizing') === 'border-box', `${sel} is not border-box: use the * selector`);
  }
});

await check('.card is 600px wide with 24px padding and a 2px border', () => {
  expect(prop('.card', 'width') === '600px', `width is "${prop('.card', 'width')}"`);
  for (const side of ['top', 'right', 'bottom', 'left']) {
    expect(prop('.card', `padding-${side}`) === '24px', `padding-${side} is "${prop('.card', `padding-${side}`)}"`);
    expect(prop('.card', `border-${side}-width`) === '2px', `border-${side}-width is "${prop('.card', `border-${side}-width`)}"`);
  }
});

await check('.card is centred horizontally with auto margins', () =>
  expect(prop('.card', 'margin-left') === 'auto' && prop('.card', 'margin-right') === 'auto',
    `margin-left/right are "${prop('.card', 'margin-left')}"/"${prop('.card', 'margin-right')}"`));

// ----- 2. Flexbox --------------------------------------------------------
await check('.site-header is a flex row: logo left, nav right, vertically centred', () => {
  expect(prop('.site-header', 'display') === 'flex', 'display: flex');
  expect(prop('.site-header', 'justify-content') === 'space-between', 'justify-content: space-between');
  expect(prop('.site-header', 'align-items') === 'center', 'align-items: center');
});

await check('.nav is a flex row with a gap between the links', () => {
  expect(prop('.nav', 'display') === 'flex', 'display: flex');
  const gap = prop('.nav', 'gap') || prop('.nav', 'column-gap');
  expect(gap && !/^0(px)?$/.test(gap), 'add a gap, e.g. gap: 1rem (no margins needed)');
});

// ----- 3. Grid -----------------------------------------------------------
await check('.gallery is a grid of three equal columns with a gap', () => {
  expect(prop('.gallery', 'display') === 'grid', 'display: grid');
  const cols = prop('.gallery', 'grid-template-columns').replace(/\s+/g, ' ');
  expect(['repeat(3, 1fr)', '1fr 1fr 1fr', 'repeat(3, minmax(0, 1fr))'].includes(cols),
    `grid-template-columns is "${cols}" (three equal fractions)`);
  const gap = prop('.gallery', 'gap') || prop('.gallery', 'column-gap');
  expect(gap && !/^0(px)?$/.test(gap), 'add a gap');
});

await check('the .wide tile spans two columns (and only that one)', () => {
  const col = (prop('.tile.wide', 'grid-column') || prop('.tile.wide', 'grid-column-end')).replace(/\s+/g, ' ');
  expect(/^(span 2( \/ span 2)?|1 \/ 3|1 \/ span 2|auto \/ span 2)$/.test(col), `grid-column is "${col}" (try span 2)`);
  const plain = prop('.tile:not(.wide)', 'grid-column');
  expect(!/span [2-9]/.test(plain), `plain tiles have grid-column "${plain}" too`);
});
