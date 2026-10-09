// Validator-owned spec: staged into the sandbox by check.mjs on each validate.
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import UsersSWR from '../src/components/UsersSWR.jsx';
import UsersQuery from '../src/components/UsersQuery.jsx';
import AddUser from '../src/components/AddUser.jsx';

// A fake /api/users backend behind a stubbed global fetch.
let users;
let failing;
let calls;
beforeEach(() => {
  users = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }];
  failing = false;
  calls = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const method = init.method ?? 'GET';
    calls.push({ method, url: String(url), body: init.body });
    await new Promise((r) => setTimeout(r, 20));
    if (failing) return new Response('boom', { status: 500 });
    if (method === 'POST') {
      const user = { id: users.length + 1, name: JSON.parse(init.body).name };
      users.push(user);
      return Response.json(user, { status: 201 });
    }
    return Response.json(users);
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const gets = () => calls.filter((c) => c.method === 'GET');
const withSWR = (ui) => render(
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false }}>{ui}</SWRConfig>,
);
const withQuery = (ui) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>,
);

test('SWR: shows "Loading users..." then the list of names', async () => {
  withSWR(<UsersSWR />);
  expect(screen.getByText('Loading users...')).toBeTruthy();
  await waitFor(() => expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Ada', 'Grace']));
  expect(screen.queryByText('Loading users...')).toBeNull();
});

test('SWR: fetches with the URL /api/users as the key', async () => {
  withSWR(<UsersSWR />);
  await waitFor(() => expect(gets().map((c) => c.url)).toContain('/api/users'));
});

test('SWR: shows "Could not load users" when the request fails', async () => {
  failing = true;
  withSWR(<UsersSWR />);
  await waitFor(() => expect(screen.getByText('Could not load users')).toBeTruthy());
});

test('TanStack: shows "Loading users..." then the list of names', async () => {
  withQuery(<UsersQuery />);
  expect(screen.getByText('Loading users...')).toBeTruthy();
  await waitFor(() => expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Ada', 'Grace']));
});

test('TanStack: shows "Could not load users" when the request fails', async () => {
  failing = true;
  withQuery(<UsersQuery />);
  await waitFor(() => expect(screen.getByText('Could not load users')).toBeTruthy());
});

test('TanStack: two lists with the same query key share one request (the cache)', async () => {
  withQuery(<><UsersQuery /><UsersQuery /></>);
  await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(4));
  expect(gets()).toHaveLength(1);
});

test('TanStack: AddUser POSTs { name } with useMutation', async () => {
  withQuery(<AddUser />);
  await userEvent.type(screen.getByLabelText('Name'), 'Linus');
  await userEvent.click(screen.getByRole('button', { name: 'Add user' }));
  await waitFor(() => expect(calls.some((c) => c.method === 'POST')).toBe(true));
  const post = calls.find((c) => c.method === 'POST');
  expect(JSON.parse(post.body)).toEqual({ name: 'Linus' });
});

test('TanStack: the button is disabled while saving, and the input clears after', async () => {
  withQuery(<AddUser />);
  await userEvent.type(screen.getByLabelText('Name'), 'Linus');
  await userEvent.click(screen.getByRole('button', { name: 'Add user' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Add user' }).disabled).toBe(true));
  await waitFor(() => expect(screen.getByLabelText('Name').value).toBe(''));
  expect(screen.getByRole('button', { name: 'Add user' }).disabled).toBe(false);
});

test('TanStack: after adding, the list refetches and shows the new user (invalidateQueries)', async () => {
  withQuery(<><UsersQuery /><AddUser /></>);
  await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));
  await userEvent.type(screen.getByLabelText('Name'), 'Linus');
  await userEvent.click(screen.getByRole('button', { name: 'Add user' }));
  await waitFor(() => expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Ada', 'Grace', 'Linus']));
  expect(gets().length).toBeGreaterThanOrEqual(2);
});
