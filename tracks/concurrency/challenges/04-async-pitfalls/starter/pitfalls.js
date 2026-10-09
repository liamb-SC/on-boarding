// Five small functions, five classic async/await bugs. Each one "works" in a
// quick manual test. Fix them without changing what they're meant to do.

// 1. Save every item. Resolve only once ALL saves have finished, and reject
//    if any save fails.
export async function saveAll(items, save) {
  items.forEach(async (item) => {
    await save(item);
  });
}

// 2. Load every id. The loads don't depend on each other. Resolve to the
//    results in the same order as `ids`.
export async function loadAll(ids, load) {
  const results = [];
  for (const id of ids) {
    results.push(await load(id));
  }
  return results;
}

// 3. Resolve to load()'s value, or to `fallback` if load() rejects.
export async function loadOr(load, fallback) {
  try {
    return load();
  } catch {
    return fallback;
  }
}

// 4. Kick off a background sync without waiting for it. If it fails, report
//    the error through onError(err). It must never crash the process.
export function startSync(sync, onError) {
  sync();
}

// 5. Only admins may delete. isAdmin(user) is async and resolves to true/false.
export async function canDelete(user, isAdmin) {
  if (isAdmin(user)) return true;
  return false;
}
