// Domain types. Right now every ID, email and amount is a plain string or
// number, so the compiler can't tell them apart.

// Result<T, E> is a generic discriminated union: check `ok` before you touch
// `value` or `error`. Use it as the return type of your parse functions.
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E = string>(error: E): Result<never, E> => ({ ok: false, error });

// TODO 1: a generic Brand<T, B> that makes a distinct type out of T.
// TODO 2: a generic Id<Entity> built on Brand, so Id<'Account'> and Id<'User'>
//         are different types.
export type AccountId = string; // TODO 3: Id<'Account'>
export type UserId = string;    // TODO 3: Id<'User'>
export type EmailAddress = string; // TODO 3: a branded string
export type Money = number;        // TODO 3: a branded number (whole pence/cents)
