// The read side: tail the outbox and keep customer_stats up to date.
//
// Each run should:
//   1. read the checkpoint for 'customer_stats' from projector_checkpoint (0 if none)
//   2. read outbox rows with id > checkpoint, in id order
//   3. apply each one to customer_stats:
//        OrderPlaced     -> orders + 1, total_spent + total  (create the row if needed)
//        OrderCancelled  -> orders - 1, total_spent - total
//   4. save the id of the last row it applied as the new checkpoint
// Do 3 and 4 in one transaction, so a crash can never apply an event twice.
// Return how many events were applied.
export function runProjector(db) {
  // TODO
  return 0;
}
