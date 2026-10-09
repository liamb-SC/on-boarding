// A Lambda-style function, triggered by an SQS queue of OrderPlaced messages.
//
// event = { Records: [{ messageId: '...', body: '<JSON order>' }, ...] }
//
// For each record: parse the order, render the receipt (reuse the monolith's
// logic, moved into lib/receipt.js), and send it with lib/mailer.js.
// Return { batchItemFailures: [{ itemIdentifier: messageId }] } listing ONLY the
// records that failed, so SQS retries just those and not the whole batch.
export async function handler(event) {
  // TODO
  return { batchItemFailures: [] };
}
