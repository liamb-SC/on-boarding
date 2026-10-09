// The Lambda handler. Lambda calls it with the invocation's JSON payload as
// `event`, and sends whatever it returns back to the caller as JSON.
//
// Input:  { "items": [{ "sku": "MUG-01", "qty": 2, "price": 8.5 }, ...] }
// Output: { "count": <total qty>, "total": <sum of qty * price, rounded to 2 dp> }
// If `items` is missing or not an array, throw an Error.

export const handler = async (event) => {
  // TODO
};
