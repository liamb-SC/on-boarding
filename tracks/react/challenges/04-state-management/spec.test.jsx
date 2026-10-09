// Validator-owned spec: staged into the sandbox by check.mjs on each validate.
import { afterEach, beforeEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import * as slice from '../src/redux/cartSlice.js';
import { makeStore } from '../src/redux/store.js';
import { useCartStore } from '../src/zustand/useCartStore.js';
import ReduxCart from '../src/components/ReduxCart.jsx';
import ZustandCart from '../src/components/ZustandCart.jsx';

const TEA = { id: 'tea', name: 'Tea', price: 3.5 };
const CAKE = { id: 'cake', name: 'Cake', price: 4.25 };

afterEach(cleanup);

// ---- Redux Toolkit -------------------------------------------------------

test('Redux: cartSlice exports addItem/removeItem/clear actions and its reducer', () => {
  for (const name of ['addItem', 'removeItem', 'clear']) {
    expect(typeof slice[name], `${name} is not exported`).toBe('function');
  }
  expect(typeof slice.default, 'the reducer is not the default export').toBe('function');
  expect(slice.addItem(TEA).type).toBe('cart/addItem');
});

test('Redux: addItem adds with qty 1, then bumps qty (and never mutates the old state)', () => {
  const reducer = slice.default;
  const empty = reducer(undefined, { type: '@@init' });
  expect(empty).toEqual({ items: [] });
  const one = reducer(empty, slice.addItem(TEA));
  const two = reducer(one, slice.addItem(TEA));
  expect(two.items).toEqual([{ ...TEA, qty: 2 }]);
  expect(one.items, 'the previous state changed').toEqual([{ ...TEA, qty: 1 }]);
  expect(empty.items).toEqual([]);
});

test('Redux: removeItem(id) removes the line, clear() empties the cart', () => {
  const reducer = slice.default;
  let s = [slice.addItem(TEA), slice.addItem(CAKE)].reduce(reducer, undefined);
  s = reducer(s, slice.removeItem('tea'));
  expect(s.items.map((i) => i.id)).toEqual(['cake']);
  expect(reducer(s, slice.clear()).items).toEqual([]);
});

test('Redux: selectItemCount and selectTotal read from the root state', () => {
  const store = makeStore();
  store.dispatch(slice.addItem(TEA));
  store.dispatch(slice.addItem(TEA));
  store.dispatch(slice.addItem(CAKE));
  expect(slice.selectItemCount(store.getState())).toBe(3);
  expect(slice.selectTotal(store.getState())).toBeCloseTo(11.25);
});

test('Redux: makeStore() returns a fresh, independent store each time', () => {
  const a = makeStore();
  const b = makeStore();
  a.dispatch(slice.addItem(TEA));
  expect(a.getState().cart.items).toHaveLength(1);
  expect(b.getState().cart.items).toHaveLength(0);
});

async function shop(view) {
  const click = (name) => userEvent.click(screen.getAllByRole('button', { name })[0]);
  await click('Add Tea');
  await click('Add Tea');
  await click('Add Cake');
  expect(view.getAllByText('Items: 3').length).toBeGreaterThan(0);
  expect(view.getAllByText('Total: £11.25').length).toBeGreaterThan(0);
  await click('Remove Tea');
  expect(view.getAllByText('Items: 1').length).toBeGreaterThan(0);
  await click('Clear');
  expect(view.getAllByText('Items: 0').length).toBeGreaterThan(0);
}

test('Redux: ReduxCart adds, removes and clears via useSelector/useDispatch', async () => {
  await shop(render(<Provider store={makeStore()}><ReduxCart /></Provider>));
});

test('Redux: two ReduxCarts under one Provider share the same state', async () => {
  render(<Provider store={makeStore()}><ReduxCart /><ReduxCart /></Provider>);
  await userEvent.click(screen.getAllByRole('button', { name: 'Add Cake' })[0]);
  expect(screen.getAllByText('Items: 1')).toHaveLength(2);
});

// ---- Zustand -------------------------------------------------------------

beforeEach(() => { useCartStore?.setState?.({ items: [] }); });

test('Zustand: useCartStore starts empty and has addItem/removeItem/clear', () => {
  const s = useCartStore.getState();
  expect(s.items).toEqual([]);
  for (const name of ['addItem', 'removeItem', 'clear']) expect(typeof s[name], `${name} missing`).toBe('function');
});

test('Zustand: addItem adds with qty 1, then bumps qty (with new arrays, not mutation)', () => {
  const before = useCartStore.getState().items;
  useCartStore.getState().addItem(TEA);
  const after1 = useCartStore.getState().items;
  useCartStore.getState().addItem(TEA);
  expect(useCartStore.getState().items).toEqual([{ ...TEA, qty: 2 }]);
  expect(before, 'the old items array was mutated').toEqual([]);
  expect(after1, 'the old items array was mutated').toEqual([{ ...TEA, qty: 1 }]);
});

test('Zustand: removeItem(id) and clear() work', () => {
  const { addItem, removeItem, clear } = useCartStore.getState();
  addItem(TEA);
  addItem(CAKE);
  removeItem('tea');
  expect(useCartStore.getState().items.map((i) => i.id)).toEqual(['cake']);
  clear();
  expect(useCartStore.getState().items).toEqual([]);
});

test('Zustand: ZustandCart adds, removes and clears with no Provider', async () => {
  await shop(render(<ZustandCart />));
});

test('Zustand: two ZustandCarts share the same store', async () => {
  render(<><ZustandCart /><ZustandCart /></>);
  await userEvent.click(screen.getAllByRole('button', { name: 'Add Cake' })[0]);
  expect(screen.getAllByText('Items: 1')).toHaveLength(2);
});
