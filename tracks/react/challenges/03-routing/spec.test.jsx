// Validator-owned spec: staged into the sandbox by check.mjs on each validate.
import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import AppRoutes from '../src/AppRoutes.jsx';

afterEach(cleanup);

// Shows the router's current path so tests can see where a click went.
function Where() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}
const at = (url) => render(
  <MemoryRouter initialEntries={[url]}><AppRoutes /><Where /></MemoryRouter>,
);
const h1 = () => screen.getByRole('heading', { level: 1 }).textContent;
const path = () => screen.getByTestId('path').textContent;

test('/ renders Home', () => {
  at('/');
  expect(h1()).toBe('Welcome to the shop');
});

test('/products renders the product list', () => {
  at('/products');
  expect(h1()).toBe('Products');
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
});

test('/products/lamp renders that product (useParams)', () => {
  at('/products/lamp');
  expect(h1()).toBe('Desk Lamp');
  expect(screen.getByText('£25')).toBeTruthy();
});

test('/products/nope says "Product not found"', () => {
  at('/products/nope');
  expect(h1()).toBe('Product not found');
});

test('an unknown URL renders NotFound (catch-all route)', () => {
  at('/definitely/not/a/page');
  expect(h1()).toBe('Page not found');
});

test('every page shows the nav from Layout, with the page below it (<Outlet />)', () => {
  for (const url of ['/', '/products', '/products/chair', '/nope']) {
    at(url);
    const nav = screen.getByRole('navigation');
    expect(nav.querySelector('a[href="/"]'), `no Home link in the nav on ${url}`).toBeTruthy();
    expect(nav.querySelector('a[href="/products"]'), `no Products link in the nav on ${url}`).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }), `no page rendered under the nav on ${url}`).toBeTruthy();
    cleanup();
  }
});

test('the nav marks the current page (NavLink sets aria-current="page")', () => {
  at('/products');
  const link = screen.getByRole('navigation').querySelector('a[href="/products"]');
  expect(link?.getAttribute('aria-current')).toBe('page');
});

test('clicking Products in the nav goes to /products without a page reload', async () => {
  at('/');
  await userEvent.click(screen.getByRole('link', { name: 'Products' }));
  expect(path()).toBe('/products');
  expect(h1()).toBe('Products');
});

test('clicking a product in the list opens its detail page (<Link>)', async () => {
  at('/products');
  await userEvent.click(screen.getByRole('link', { name: 'Office Chair' }));
  expect(path()).toBe('/products/chair');
  expect(h1()).toBe('Office Chair');
});

test('"Back to products" navigates to /products (useNavigate)', async () => {
  at('/products/kettle');
  await userEvent.click(screen.getByRole('button', { name: 'Back to products' }));
  expect(path()).toBe('/products');
});
