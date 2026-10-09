// Validator-owned spec: staged into the sandbox by check.mjs on each validate.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as listRoute from '../app/api/products/route.js';
import * as itemRoute from '../app/api/products/[id]/route.js';
import ProductsPage from '../app/products/page.jsx';
import LikeButton from '../app/components/LikeButton.jsx';

afterEach(cleanup);

const source = (f) => readFileSync(path.join(process.cwd(), f), 'utf8');
// A directive must be the first statement: 'use client' / "use client"
const hasUseClient = (src) => /^\s*(\/\/[^\n]*\n\s*|\/\*[\s\S]*?\*\/\s*)*['"]use client['"]/.test(src);

const PRODUCTS = [
  { id: 'kettle', name: 'Smart Kettle', price: 49 },
  { id: 'lamp', name: 'Desk Lamp', price: 25 },
  { id: 'chair', name: 'Office Chair', price: 189 },
];

test('GET /api/products returns 200 and the products as JSON', async () => {
  expect(typeof listRoute.GET, 'app/api/products/route.js exports no GET function').toBe('function');
  const res = await listRoute.GET(new Request('http://localhost/api/products'));
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toMatch(/application\/json/);
  expect(await res.json()).toEqual(PRODUCTS);
});

test('GET /api/products/lamp returns that product (awaiting the params promise)', async () => {
  expect(typeof itemRoute.GET, 'app/api/products/[id]/route.js exports no GET function').toBe('function');
  const res = await itemRoute.GET(new Request('http://localhost/api/products/lamp'),
    { params: Promise.resolve({ id: 'lamp' }) });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual(PRODUCTS[1]);
});

test('GET /api/products/nope returns 404 with { error: "Not found" }', async () => {
  const res = await itemRoute.GET(new Request('http://localhost/api/products/nope'),
    { params: Promise.resolve({ id: 'nope' }) });
  expect(res.status).toBe(404);
  expect(await res.json()).toEqual({ error: 'Not found' });
});

test('products page is a Server Component (no "use client", no useState/useEffect)', () => {
  const src = source('app/products/page.jsx');
  expect(hasUseClient(src), 'app/products/page.jsx still starts with "use client"').toBe(false);
  expect(src, 'a server component cannot use useState/useEffect').not.toMatch(/\buse(State|Effect)\b/);
});

test('products page loads its data on the server with getProducts(), not fetch', () => {
  const src = source('app/products/page.jsx');
  expect(src).toMatch(/\bgetProducts\s*\(/);
  expect(src, 'no need to fetch your own API from a server component').not.toMatch(/\bfetch\s*\(/);
});

test('products page renders a heading and every product with a LikeButton', async () => {
  // A server component is just a (possibly async) function: call it, render the result.
  render(await ProductsPage());
  expect(screen.getByRole('heading', { level: 1, name: 'Products' })).toBeTruthy();
  const items = screen.getAllByRole('listitem');
  expect(items).toHaveLength(3);
  expect(items[2].textContent).toContain('Office Chair');
  expect(items[2].textContent).toContain('£189');
  for (const li of items) expect(within(li).getByRole('button', { name: 'Like' })).toBeTruthy();
});

test('LikeButton is a Client Component ("use client" at the top)', () => {
  expect(hasUseClient(source('app/components/LikeButton.jsx'))).toBe(true);
});

test('LikeButton toggles Like -> Liked -> Like, with aria-pressed', async () => {
  render(<LikeButton />);
  const btn = screen.getByRole('button', { name: 'Like' });
  expect(btn.getAttribute('aria-pressed')).toBe('false');
  await userEvent.click(btn);
  expect(btn.textContent).toBe('Liked');
  expect(btn.getAttribute('aria-pressed')).toBe('true');
  await userEvent.click(btn);
  expect(btn.textContent).toBe('Like');
});
