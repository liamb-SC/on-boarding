// Pretend database. Only server code (server components, route handlers)
// should import this. In a real app it would hold credentials.
const PRODUCTS = [
  { id: 'kettle', name: 'Smart Kettle', price: 49 },
  { id: 'lamp', name: 'Desk Lamp', price: 25 },
  { id: 'chair', name: 'Office Chair', price: 189 },
];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export async function getProducts() {
  await delay(50);
  return PRODUCTS;
}

export async function getProduct(id) {
  await delay(50);
  return PRODUCTS.find((p) => p.id === id) ?? null;
}
