// An append-only event store, plus a projector that feeds new events to a read
// model. Don't edit this file.
//
//   store.append({ type, accountId, ... })   -> the stored event, with a global `position`
//   store.forAccount(accountId)              -> that account's events, oldest first
//   store.readFrom(position)                 -> every event after `position`
//
//   const projector = createProjector(store, projection);
//   projector.catchUp()                      -> applies new events to projection.apply(); returns how many
export function createEventStore() {
  const events = [];
  return {
    append(event) {
      const stored = Object.freeze({ ...event, position: events.length + 1 });
      events.push(stored);
      return stored;
    },
    forAccount(accountId) { return events.filter((e) => e.accountId === accountId); },
    readFrom(position = 0) { return events.slice(position); },
    get length() { return events.length; },
  };
}

export function createProjector(store, projection) {
  let position = 0;
  return {
    catchUp() {
      const batch = store.readFrom(position);
      for (const event of batch) {
        projection.apply(event);
        position = event.position;
      }
      return batch.length;
    },
  };
}
