import { parseAccountId, parseEmail, parseUserId } from './parse.js';
import { sendStatement } from './statements.js';

// Values arrive as raw strings (from a request, a CSV, a queue message...).
const rawAccount = 'acc_1a2b3c4d';
const rawUser = 'usr_9z8y7x6w';
const rawEmail = '  Alice@Example.com ';

const account = parseAccountId(rawAccount);
const user = parseUserId(rawUser);
const email = parseEmail(rawEmail);
if (!account.ok || !user.ok || !email.ok) {
  console.error('invalid input');
  process.exit(1);
}

// This compiles today, but the arguments are in the wrong order.
console.log(sendStatement(account.value, user.value, email.value));
