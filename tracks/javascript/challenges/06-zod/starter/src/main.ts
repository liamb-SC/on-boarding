import { parseSignup } from './signup.js';

// Pretend these arrived as JSON request bodies.
const bodies: unknown[] = [
  { email: 'ada@example.com', password: 'correct horse' },
  { email: 'linus@example.com', password: 'hunter2hunter2', age: 30, plan: 'pro' },
  { email: 'not-an-email', password: 'short', age: 9 },
  'definitely not an object',
];

for (const body of bodies) console.log(JSON.stringify(parseSignup(body)));
