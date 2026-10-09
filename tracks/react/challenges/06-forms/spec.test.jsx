// Validator-owned spec: staged into the sandbox by check.mjs on each validate.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signupSchema } from '../src/signupSchema.js';
import SignupForm from '../src/SignupForm.jsx';

afterEach(cleanup);

const GOOD = { email: 'ada@example.com', password: 'correct-horse', confirmPassword: 'correct-horse', terms: true };

// All messages the schema produces for some values.
async function messages(values) {
  try {
    await signupSchema.validate(values, { abortEarly: false });
    return [];
  } catch (e) {
    return e.errors ?? [String(e)];
  }
}

test('schema: valid values pass', async () => {
  expect(await messages(GOOD)).toEqual([]);
});

test('schema: email is required and must look like an email', async () => {
  expect(await messages({ ...GOOD, email: '' })).toContain('Email is required');
  expect(await messages({ ...GOOD, email: 'not-an-email' })).toContain('Enter a valid email');
});

test('schema: password is required and at least 8 characters', async () => {
  expect(await messages({ ...GOOD, password: '', confirmPassword: '' })).toContain('Password is required');
  expect(await messages({ ...GOOD, password: 'short', confirmPassword: 'short' }))
    .toContain('Password must be at least 8 characters');
});

test('schema: confirmPassword is required and must match password', async () => {
  expect(await messages({ ...GOOD, password: '', confirmPassword: '' })).toContain('Please confirm your password');
  expect(await messages({ ...GOOD, confirmPassword: 'something-else' })).toContain('Passwords must match');
});

test('schema: the terms must be accepted', async () => {
  expect(await messages({ ...GOOD, terms: false })).toContain('You must accept the terms');
});

test('SignupForm uses react-hook-form with yupResolver', () => {
  const src = readFileSync(path.join(process.cwd(), 'src/SignupForm.jsx'), 'utf8');
  expect(src, 'no useForm from react-hook-form').toMatch(/from ['"]react-hook-form['"]/);
  expect(src, 'no yupResolver from @hookform/resolvers/yup').toMatch(/@hookform\/resolvers\/yup/);
});

const fill = async ({ email, password, confirmPassword, terms }) => {
  if (email) await userEvent.type(screen.getByLabelText('Email'), email);
  if (password) await userEvent.type(screen.getByLabelText('Password'), password);
  if (confirmPassword) await userEvent.type(screen.getByLabelText('Confirm password'), confirmPassword);
  if (terms) await userEvent.click(screen.getByLabelText('I accept the terms'));
};
const submit = () => userEvent.click(screen.getByRole('button', { name: 'Create account' }));
const alerts = () => screen.queryAllByRole('alert').map((a) => a.textContent);

test('form: submitting empty shows each error in a role="alert" and does not submit', async () => {
  const onSubmit = vi.fn();
  render(<SignupForm onSubmit={onSubmit} />);
  await submit();
  await waitFor(() => expect(alerts()).toEqual(expect.arrayContaining(
    ['Email is required', 'Password is required', 'Please confirm your password', 'You must accept the terms'])));
  expect(onSubmit).not.toHaveBeenCalled();
});

test('form: invalid fields are marked aria-invalid="true"', async () => {
  render(<SignupForm onSubmit={() => {}} />);
  await fill({ email: 'nope', password: 'correct-horse', confirmPassword: 'correct-horse', terms: true });
  await submit();
  await waitFor(() => expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe('true'));
  expect(screen.getByLabelText('Password').getAttribute('aria-invalid')).not.toBe('true');
});

test('form: mismatched passwords show "Passwords must match"', async () => {
  const onSubmit = vi.fn();
  render(<SignupForm onSubmit={onSubmit} />);
  await fill({ ...GOOD, confirmPassword: 'correct-horsE' });
  await submit();
  await waitFor(() => expect(alerts()).toEqual(['Passwords must match']));
  expect(onSubmit).not.toHaveBeenCalled();
});

test('form: an error clears once the field is fixed', async () => {
  render(<SignupForm onSubmit={() => {}} />);
  await fill({ ...GOOD, email: 'ada' });
  await submit();
  await waitFor(() => expect(alerts()).toEqual(['Enter a valid email']));
  await userEvent.type(screen.getByLabelText('Email'), '@example.com');
  await waitFor(() => expect(alerts()).toEqual([]));
});

test('form: valid input calls onSubmit once with the values', async () => {
  const onSubmit = vi.fn();
  render(<SignupForm onSubmit={onSubmit} />);
  await fill(GOOD);
  await submit();
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0][0]).toMatchObject(GOOD);
  expect(alerts()).toEqual([]);
});
