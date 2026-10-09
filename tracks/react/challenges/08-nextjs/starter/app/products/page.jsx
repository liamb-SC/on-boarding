'use client';

// Written the "old SPA way": ship the component to the browser, render an
// empty list, then fetch JSON from our own API in an effect. And the API
// doesn't even exist yet.
import { useEffect, useState } from 'react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then(setProducts);
  }, []);

  return (
    <>
      <h1>Products</h1>
      <ul>
        {products.map((p) => (
          <li key={p.id}>{p.name} · £{p.price}</li>
        ))}
      </ul>
    </>
  );
}
