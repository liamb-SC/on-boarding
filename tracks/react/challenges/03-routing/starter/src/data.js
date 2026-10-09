export const PRODUCTS = [
  { id: 'kettle', name: 'Smart Kettle', price: 49 },
  { id: 'lamp', name: 'Desk Lamp', price: 25 },
  { id: 'chair', name: 'Office Chair', price: 189 },
];

export const findProduct = (id) => PRODUCTS.find((p) => p.id === id);
