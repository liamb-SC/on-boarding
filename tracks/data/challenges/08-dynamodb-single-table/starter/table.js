// A tiny in-memory model of a DynamoDB table, with one GSI ("GSI1"). It only
// supports Query: an exact partition key, plus an optional sort-key prefix.
// There's no Scan. Don't edit this file.
//
//   table.put(item)   // the item must have string PK and SK; GSI1PK/GSI1SK are optional
//   table.query({ pk, skBeginsWith, index: 'GSI1', forward: false })
//
// Like DynamoDB, results are sorted by the sort key (as a string), ascending
// unless forward is false. An item only appears in GSI1 if it has GSI1PK and GSI1SK.
export function createTable() {
  const items = new Map();
  return {
    items,
    put(item) {
      if (typeof item.PK !== 'string' || typeof item.SK !== 'string' || !item.PK || !item.SK) {
        throw new Error(`every item needs non-empty string PK and SK: ${JSON.stringify(item)}`);
      }
      const id = `${item.PK}|${item.SK}`;
      if (items.has(id)) throw new Error(`two items share the key PK=${item.PK} SK=${item.SK}; the second would overwrite the first`);
      items.set(id, item);
    },
    query({ pk, skBeginsWith = '', index, forward = true }) {
      if (index !== undefined && index !== 'GSI1') throw new Error(`there is no index called ${index}`);
      const [P, S] = index ? ['GSI1PK', 'GSI1SK'] : ['PK', 'SK'];
      const rows = [...items.values()]
        .filter((it) => typeof it[P] === 'string' && typeof it[S] === 'string')
        .filter((it) => it[P] === pk && it[S].startsWith(skBeginsWith))
        .sort((a, b) => (a[S] < b[S] ? -1 : a[S] > b[S] ? 1 : 0));
      return forward ? rows : rows.reverse();
    },
  };
}
