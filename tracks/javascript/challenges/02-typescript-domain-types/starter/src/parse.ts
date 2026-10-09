// The only place raw input becomes a domain type. Each function checks the
// rules once, so code that receives an AccountId never has to check again.
import { err, ok, type AccountId, type EmailAddress, type Money, type Result, type UserId } from './types.js';

// TODO 4: trim and lowercase, then reject '' / anything over 254 characters /
// anything that isn't local@domain.tld.
export function parseEmail(raw: string): Result<EmailAddress> {
  return ok(raw);
}

// TODO 5: 'acc_' followed by exactly 8 lowercase letters or digits.
export function parseAccountId(raw: string): Result<AccountId> {
  return ok(raw);
}

// TODO 5: 'usr_' followed by exactly 8 lowercase letters or digits.
export function parseUserId(raw: string): Result<UserId> {
  return ok(raw);
}

// TODO 6: a whole, non-negative number of pence. Reject -1, 1.5, NaN, Infinity.
export function parseMoney(pence: number): Result<Money> {
  return ok(pence);
}
