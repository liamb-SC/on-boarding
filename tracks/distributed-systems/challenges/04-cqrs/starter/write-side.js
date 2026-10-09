// COMMAND side. It decides whether a command is allowed, and records what happened as events.
// It never answers queries, and it never reads from the read side.
//
// Commands:                                      Events to append:
//   { type: 'OpenAccount', accountId, owner }  -> { type: 'AccountOpened',  accountId, owner }
//   { type: 'Deposit', accountId, amount }     -> { type: 'MoneyDeposited', accountId, amount }
//   { type: 'Withdraw', accountId, amount }    -> { type: 'MoneyWithdrawn', accountId, amount }
//
// Rules (throw an Error and append nothing if one is broken):
//   - an account can only be opened once
//   - deposits and withdrawals need an existing account and an amount > 0
//   - a withdrawal can't take the balance below 0
export function createCommandHandler(store) {
  return {
    handle(command) {
      // TODO
    },
  };
}
