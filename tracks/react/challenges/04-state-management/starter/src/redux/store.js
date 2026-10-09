import { configureStore } from '@reduxjs/toolkit';

// makeStore() builds a fresh store (tests use one per test). The app uses
// the single `store` below.
export function makeStore() {
  // TODO: configureStore with the cart reducer under the `cart` key
}

export const store = makeStore();
