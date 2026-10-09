import { PRODUCTS } from '../products.js';

export default function ReduxCart() {
  // TODO: read items, count and total with useSelector, and get dispatch
  // with useDispatch, then wire up the buttons below.
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
