import { PRODUCTS } from '../products.js';

export default function ZustandCart() {
  // TODO: read items and the actions from useCartStore (select just what
  // you need, e.g. useCartStore((s) => s.items)), then wire up the buttons.
  const items = [];
  const count = 0;
  const total = 0;

  return (
    <div>
      {PRODUCTS.map((p) => (
        <button key={p.id} onClick={() => {}}>Add {p.name}</button>
      ))}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.name} × {item.qty}{' '}
            <button onClick={() => {}}>Remove {item.name}</button>
          </li>
        ))}
      </ul>
      <p>Items: {count}</p>
      <p>Total: £{total.toFixed(2)}</p>
      <button onClick={() => {}}>Clear</button>
    </div>
  );
}
