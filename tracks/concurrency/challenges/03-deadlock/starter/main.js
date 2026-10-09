import { createAccounts, transfer } from './accounts.js';

const accounts = createAccounts({ alice: 100, bob: 100 });
const watchdog = setTimeout(() => {
  console.log('Still waiting after 2s: both transfers are stuck. Deadlock!');
  process.exit(1);
}, 2000);

// Alice pays Bob while Bob pays Alice.
await Promise.all([
  transfer(accounts, 'alice', 'bob', 10),
  transfer(accounts, 'bob', 'alice', 20),
]);
clearTimeout(watchdog);
console.log('done:', { alice: accounts.alice.balance, bob: accounts.bob.balance }, '(expected alice 110, bob 90)');
