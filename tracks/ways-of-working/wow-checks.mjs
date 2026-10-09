// Helpers shared by the ways-of-working track's check.mjs validators: reading
// the learner's markdown, and pulling out its sections and tables.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, SANDBOX } from '../../lib/checks.mjs';

export const TEAM = ['Priya Shah', 'Tom Okafor', 'Aisha Khan', 'Dan Lee', 'Sofia Ruiz', 'Ben Morris'];

// read(rel) — a sandbox file's text, or a readable error if it's missing.
export function read(rel) {
  const file = path.join(SANDBOX, rel);
  expect(existsSync(file), `${rel} is missing`);
  return readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

// Lower-case, with markdown emphasis and code ticks removed, for keyword matching.
export const norm = (s) => String(s ?? '').replace(/[*_`]/g, '').trim().toLowerCase();
export const words = (s) => norm(s).split(/\s+/).filter(Boolean).length;
export const isPlaceholder = (s) => /todo|tbd|<[^>]*>|^\s*$|^\.\.\.$/i.test(String(s ?? ''));

// sections(md) — every heading with the text under it (up to the next heading
// of the same or a higher level). [{ level, title, body }]
export function sections(md) {
  const lines = md.split('\n');
  const heads = [];
  let fence = false;
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) fence = !fence;
    const m = !fence && line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (m) heads.push({ i, level: m[1].length, title: m[2] });
  });
  return heads.map((h, n) => {
    const end = heads.slice(n + 1).find((x) => x.level <= h.level)?.i ?? lines.length;
    return { level: h.level, title: h.title, body: lines.slice(h.i + 1, end).join('\n').trim() };
  });
}

// section(md, re) — the first section whose title matches re; throws if none.
export function section(md, re, label = String(re)) {
  const s = sections(md).find((x) => re.test(norm(x.title)));
  expect(s, `no "${label}" heading found`);
  return s;
}

// tables(md) — every pipe table: { headers: ['id', 'type', ...], rows: [{ id, type, ... }] }.
// Headers are normalised (lower-case, no emphasis); cell values are trimmed.
export function tables(md) {
  const split = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  const lines = md.split('\n');
  const out = [];
  for (let i = 0; i < lines.length - 1; i++) {
    if (!/^\s*\|/.test(lines[i]) || !/^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) continue;
    const headers = split(lines[i]).map(norm);
    const rows = [];
    let j = i + 2;
    for (; j < lines.length && /^\s*\|/.test(lines[j]); j++) {
      const cells = split(lines[j]);
      rows.push(Object.fromEntries(headers.map((h, k) => [h, cells[k] ?? ''])));
    }
    out.push({ headers, rows });
    i = j - 1;
  }
  return out;
}

// table(md, cols) — the first table that has every column in cols (matched by
// prefix, so 'mitigation' finds 'mitigation / next step'). Rows are re-keyed by
// the names in cols. Placeholder rows (all cells empty / TODO) are dropped.
export function table(md, cols, label = 'the table') {
  for (const t of tables(md)) {
    const keys = cols.map((c) => t.headers.find((h) => h.startsWith(c)));
    if (keys.some((k) => k === undefined)) continue;
    const rows = t.rows
      .map((r) => Object.fromEntries(cols.map((c, n) => [c, r[keys[n]]])))
      .filter((r) => !Object.values(r).every((v) => isPlaceholder(v) || /^-*$/.test(v)));
    return { headers: t.headers, rows, raw: t.rows };
  }
  throw new Error(`${label} needs the columns: ${cols.join(', ')}`);
}

// Matches a team member by full or first name ("Aisha", "Aisha Khan"); returns the full name.
export function person(s) {
  const n = norm(s);
  return TEAM.find((p) => n === p.toLowerCase() || n === p.split(' ')[0].toLowerCase());
}

export const isIsoDate = (s) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`))
  && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);
