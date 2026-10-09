import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, SANDBOX } from '../../../../lib/checks.mjs';

// Answers are stored as hashes, so reading this file doesn't give them away.
const HASHES = {
  semanticElement: 'c8f1d1312a3b95ae',
  colorInput: '649a1829bebcb7e0',
  flexShrinkInitial: '9bd4a9fbfe5a3d6e',
  stickyPosition: '0274f5eefc095389',
  sortedCopy: '73d86dc9af501dad',
  tooManyRequests: 'd4f94938e4b7d569',
  corsHeader: 'd94411464c903f0e',
  announceUpdates: 'd0df0edc45a2a470',
  deepCopy: 'fde069f79bbade98',
};
const QUESTIONS = {
  semanticElement: 'the element for a self-contained, independently distributable composition',
  colorInput: 'the <input> type that shows a colour picker',
  flexShrinkInitial: 'the initial value of flex-shrink',
  stickyPosition: 'the position value that scrolls normally, then sticks',
  sortedCopy: 'the Array method that returns a sorted copy',
  tooManyRequests: 'the HTTP status code for Too Many Requests',
  corsHeader: 'the CORS response header that names the allowed origin',
  announceUpdates: 'the attribute that makes screen readers announce updates',
  deepCopy: 'the global function that deep-copies a value',
};
const hash = (key, v) => createHash('sha256').update(`${key}:${v}`).digest('hex').slice(0, 16);

// "Array.prototype.toSorted()", "<article>", "position: sticky" and
// "429 Too Many Requests" all count: any one of the first three words may match.
const candidates = (raw) => String(raw ?? '').toLowerCase()
  .replace(/[`'"<>]/g, ' ').replace(/\(\)/g, ' ')
  .replace(/\b(array\.prototype|window|globalthis|self)\./g, '')
  .split(/[\s:=;,]+/).filter(Boolean).slice(0, 3);

let answers = {};
await check('answers.json is valid JSON', () => {
  answers = JSON.parse(readFileSync(path.join(SANDBOX, 'answers.json'), 'utf8'));
});

for (const [key, want] of Object.entries(HASHES)) {
  await check(`${key}: ${QUESTIONS[key]}`, () => {
    const { answer, source } = answers[key] ?? {};
    expect(String(answer ?? '').trim(), 'not answered yet');
    expect(candidates(answer).some((c) => hash(key, c) === want), `"${answer}" is not it`);
    expect(/^https:\/\/developer\.mozilla\.org\/[a-z-]+\/docs\//i.test(String(source ?? '').trim()),
      'add the MDN page you found it on as "source" (https://developer.mozilla.org/en-US/docs/...)');
  });
}
