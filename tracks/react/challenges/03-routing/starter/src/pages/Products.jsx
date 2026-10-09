import { PRODUCTS } from '../data.js';

export default function Products() {
  return (
    <>
      <h1>Products</h1>
      <ul>
        {PRODUCTS.map((p) => (
          // TODO: a plain <a> reloads the whole app. Use the router's link.
          <li key={p.id}><a href={`/products/${p.id}`}>{p.name}</a></li>
        ))}
      </ul>
    </>
  );
}
