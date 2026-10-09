// A shopping cart. Prices are in pence, so the maths stays in whole numbers.

// Sum of price x quantity for every line.
function subtotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

// SAVE10 takes 10% off (rounded to the nearest penny). FIVEOFF takes 500p
// off, but never below zero. No code means no discount. Anything else is an error.
function applyDiscount(amount, code) {
  if (!code) return amount;
  if (code === 'SAVE10') return Math.round(amount * 0.9);
  if (code === 'FIVEOFF') return Math.max(0, amount - 500);
  throw new Error(`Unknown discount code: ${code}`);
}

// Charge the customer through `payments` (anything with an async
// charge({ customerId, amount }) that resolves to { id }).
async function checkout(cart, payments, code) {
  if (cart.items.length === 0) throw new Error('Cart is empty');
  const amount = applyDiscount(subtotal(cart.items), code);
  let receipt;
  try {
    receipt = await payments.charge({ customerId: cart.customerId, amount });
  } catch (err) {
    throw new Error(`Payment failed: ${err.message}`);
  }
  return { amount, receiptId: receipt.id };
}

module.exports = { subtotal, applyDiscount, checkout };
