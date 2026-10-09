import { createSlice } from '@reduxjs/toolkit';
import { countItems, totalPrice } from '../cartMath.js';

// The cart's state is { items: [{ id, name, price, qty }] }.
//   addItem(product)  adds the product with qty 1, or bumps qty if it's there
//   removeItem(id)    removes that line entirely
//   clear()           empties the cart
// createSlice uses Immer, so reducers may "mutate" state directly.

// TODO: const cartSlice = createSlice({ name: 'cart', initialState, reducers: { ... } });

// TODO: export const { addItem, removeItem, clear } = cartSlice.actions;
// TODO: export default cartSlice.reducer;

// Selectors take the ROOT state, where this slice lives under `cart`.
export const selectItems = (state) => state.cart.items;
// TODO: selectItemCount and selectTotal (use the helpers from cartMath.js)
