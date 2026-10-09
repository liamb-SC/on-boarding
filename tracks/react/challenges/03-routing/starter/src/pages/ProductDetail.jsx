import { findProduct } from '../data.js';

export default function ProductDetail() {
  // TODO: read :id from the URL instead of always showing the kettle
  const product = findProduct('kettle');

  // TODO: unknown id -> <h1>Product not found</h1>

  return (
    <>
      <h1>{product.name}</h1>
      <p>£{product.price}</p>
      {/* TODO: a "Back to products" button that navigates to /products */}
    </>
  );
}
