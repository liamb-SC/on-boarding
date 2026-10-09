// QUERY side. It's a read model built only from events, shaped for the screens that read it.
// It never validates anything. It just records what already happened.
export function createProjection() {
  // TODO: choose a shape that makes the queries below cheap

  return {
    // Called once for every event, in order.
    apply(event) {
      // TODO
    },

    // { accountId, owner, balance }, or null if there's no such account
    getAccount(accountId) {
      return null;
    },

    // [{ accountId, balance }] for one owner, sorted by accountId
    accountsOf(owner) {
      return [];
    },

    // The n accounts with the highest balance: [{ accountId, balance }], highest first
    topAccounts(n) {
      return [];
    },
  };
}
