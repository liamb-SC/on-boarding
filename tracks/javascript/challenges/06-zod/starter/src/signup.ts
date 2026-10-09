import { z } from 'zod';

// The type is written by hand, and nothing checks that incoming data matches it.
export interface Signup {
  email: string;
  password: string;
  age?: number;
  plan: 'free' | 'pro';
}

// TODO: export const SignupSchema = z.object({ ... })
// TODO: replace the interface above with: export type Signup = z.infer<typeof SignupSchema>

export type ParseResult = { ok: true; data: Signup } | { ok: false; errors: string[] };

// Trusts its input blindly. Make it validate with SignupSchema.safeParse.
export function parseSignup(input: unknown): ParseResult {
  return { ok: true, data: input as Signup };
}
