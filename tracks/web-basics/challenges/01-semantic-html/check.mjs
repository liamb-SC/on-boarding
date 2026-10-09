import { check, expect } from '../../../../lib/checks.mjs';
import { load } from '../../dom.mjs';

let doc;
await check('index.html parses', () => { ({ document: doc } = load('index.html')); });
const $ = (s) => doc?.querySelector(s);
const $$ = (s) => [...(doc?.querySelectorAll(s) ?? [])];
const text = (el) => el?.textContent.replace(/\s+/g, ' ').trim() ?? '';

await check('it starts with <!doctype html> and <html lang="...">', () => {
  expect(doc.doctype?.name === 'html', 'add <!doctype html> as the first line');
  expect($('html').getAttribute('lang'), 'add lang="en" to <html> so screen readers pick the right voice');
});

await check('landmarks: <header>, <nav>, one <main> and <footer>', () => {
  for (const tag of ['header', 'nav', 'main', 'footer']) expect($(tag), `no <${tag}>`);
  expect($$('main').length === 1, 'use exactly one <main>');
});

await check('the three site links live in the <nav>', () => {
  const links = $$('nav a').map((a) => a.getAttribute('href'));
  expect(['/', '/menu', '/contact'].every((h) => links.includes(h)), `nav links: ${links.join(', ') || 'none'}`);
});

await check('one <h1> for the page title ("Fresh bread, every morning")', () => {
  expect($$('h1').length === 1, `found ${$$('h1').length} <h1>`);
  expect(/fresh bread/i.test(text($('h1'))), `the <h1> says "${text($('h1'))}"`);
});

await check('"Sourdough is back" is an <article> with its own heading', () => {
  const article = $$('article').find((a) => /sourdough is back/i.test(text(a)));
  expect(article, 'wrap the post in <article>');
  expect([...article.querySelectorAll('h2,h3')].some((h) => /sourdough is back/i.test(text(h))), 'its title should be an <h2> (or <h3>)');
});

await check('"Order ahead" is a heading, and heading levels never skip (h1 → h2 → h3)', () => {
  expect($$('h2,h3').some((h) => /order ahead/i.test(text(h))), '"Order ahead" should be an <h2>');
  let prev = 0;
  for (const h of $$('h1,h2,h3,h4,h5,h6')) {
    const level = Number(h.tagName[1]);
    expect(level <= prev + 1, `<${h.tagName.toLowerCase()}> "${text(h)}" skips a level`);
    prev = level;
  }
});

await check('the image has a meaningful alt text', () => {
  const img = $('img');
  expect(img, 'keep the image');
  expect((img.getAttribute('alt') ?? '').trim().length >= 5, 'describe it, e.g. alt="A golden sourdough loaf"');
});

await check('the inputs are inside a real <form>', () => {
  const form = $('form');
  expect(form, 'no <form>');
  expect(['name', 'email', 'loaves'].every((id) => form.querySelector(`#${id}`)), 'the three inputs should be inside the form');
});

await check('every input has a <label> (clicking it focuses the input)', () => {
  for (const id of ['name', 'email', 'loaves']) {
    const input = $(`#${id}`);
    expect(input, `keep the input with id="${id}"`);
    expect(input.labels?.length && text(input.labels[0]), `#${id} has no <label for="${id}">`);
  }
});

await check('inputs use the right types: email is type="email", loaves is type="number" min="1"', () => {
  expect($('#email')?.type === 'email', '#email should be type="email"');
  expect($('#loaves')?.type === 'number', '#loaves should be type="number"');
  expect($('#loaves')?.getAttribute('min') === '1', '#loaves needs min="1"');
});

await check('name and email are required', () =>
  expect($('#name')?.required && $('#email')?.required, 'add the `required` attribute'));

await check('the form submits with a real <button>, not a clickable <div>', () => {
  const btn = $('form button');
  expect(btn && (btn.type === 'submit'), 'use <button type="submit">Order</button> inside the form');
  expect(!$$('[onclick]').length, 'no onclick="" attributes: a <div> is not focusable or keyboard-operable');
});
