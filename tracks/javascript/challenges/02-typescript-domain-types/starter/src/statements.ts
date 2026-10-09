import type { AccountId, EmailAddress, Money, UserId } from './types.js';

// TODO 7: once the types are branded, these signatures reject swapped
// arguments. Fix the call sites tsc then complains about.
export function sendStatement(user: UserId, account: AccountId, email: EmailAddress): string {
  return `Statement for ${account} sent to ${user} at ${email}`;
}

// Two parameters of the SAME brand can still be swapped (from/to are both
// AccountId), so this one takes a named object instead.
export interface Transfer { from: AccountId; to: AccountId; amount: Money }

export function transferFunds({ from, to, amount }: Transfer): string {
  return `Moved ${amount}p from ${from} to ${to}`;
}
