const { subtotal, applyDiscount, checkout } = require('./cart');

describe('subtotal', () => {
  test('is 0 for an empty cart', () => {
    expect(subtotal([])).toBe(0);
  });

  // TODO: price x qty, summed over several lines
});

describe('applyDiscount', () => {
  // TODO: no code, SAVE10, FIVEOFF (and its floor at 0), an unknown code
});

describe('checkout', () => {
  // TODO: use a mock payments client:
  //   const payments = { charge: jest.fn().mockResolvedValue({ id: 'rcpt_1' }) };
});
