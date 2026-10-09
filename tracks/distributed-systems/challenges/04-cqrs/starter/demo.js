// npm run demo
import { createEventStore, createProjector } from './event-store.js';
import { createCommandHandler } from './write-side.js';
import { createProjection } from './read-side.js';

const store = createEventStore();
const commands = createCommandHandler(store);
const view = createProjection();
const projector = createProjector(store, view);

commands.handle({ type: 'OpenAccount', accountId: 'acc-1', owner: 'ada' });
commands.handle({ type: 'Deposit', accountId: 'acc-1', amount: 100 });
commands.handle({ type: 'Withdraw', accountId: 'acc-1', amount: 30 });
try {
  commands.handle({ type: 'Withdraw', accountId: 'acc-1', amount: 500 });
} catch (err) {
  console.log('rejected:', err.message);
}

console.log('before catch-up (eventually consistent!):', view.getAccount('acc-1'));
console.log('applied', projector.catchUp(), 'events');
console.log('after catch-up:', view.getAccount('acc-1'));
console.log('events:', store.readFrom(0));
