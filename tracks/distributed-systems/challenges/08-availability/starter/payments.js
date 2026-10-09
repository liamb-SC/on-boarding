// Idempotent payments: the client sends an Idempotency-Key with each charge. A
// retried request (same key) must NOT charge the card twice. It gets the
// original result back.
//
//   const payments = createPaymentHandler(processor);
//   await payments.charge({ idempotencyKey: 'k1', amount: 500 })  -> { chargeId, amount }
//
// Rules:
//   - a missing idempotencyKey               -> throw (error.code = 'MISSING_KEY')
//   - same key, same amount                  -> return the first result; processor.charge runs once
//   - same key arriving while the first call is still in flight -> also only one charge
//   - same key, different amount             -> throw (error.code = 'KEY_REUSED')
//   - if the first charge failed, the key isn't "used up": a retry may charge
export function createPaymentHandler(processor) {
  return {
    async charge({ idempotencyKey, amount }) {
      // TODO
      return processor.charge(amount);
    },
  };
}
