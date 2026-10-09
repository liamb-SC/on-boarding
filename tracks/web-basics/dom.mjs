// Helpers shared by the web-basics track's check.mjs validators.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, fromSandbox, SANDBOX } from '../../lib/checks.mjs';

const { JSDOM, VirtualConsole } = await fromSandbox('jsdom');

export const read = (f) => (existsSync(path.join(SANDBOX, f)) ? readFileSync(path.join(SANDBOX, f), 'utf8') : '');

// load(file, { css, html }) — parse a sandbox HTML file with jsdom (no scripts
// run). `css` inlines sandbox stylesheets so getComputedStyle sees them; `html`
// uses validator-owned markup instead of the file.
export function load(file, { css = [], html = read(file) } = {}) {
  expect(html, `${file} is missing`);
  for (const sheet of css) html = html.replace('</head>', `<style>${read(sheet)}</style></head>`);
  const virtualConsole = new VirtualConsole(); // keep jsdom's CSS parse warnings quiet
  const dom = new JSDOM(html, { virtualConsole });
  return { dom, window: dom.window, document: dom.window.document };
}

export { JSDOM, VirtualConsole };
