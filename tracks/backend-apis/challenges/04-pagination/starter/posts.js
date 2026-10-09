// 25 posts, newest first (a higher id is newer), like a social feed.
export function createPosts() {
  return Array.from({ length: 25 }, (_, i) => {
    const id = 25 - i;
    return { id, title: `Post #${id}` };
  });
}

// "Someone publishes a post": it goes to the top of the feed.
export function publish(rows, title) {
  const id = Math.max(0, ...rows.map((r) => r.id)) + 1;
  rows.unshift({ id, title });
  return id;
}

// "Someone deletes a post."
export function remove(rows, id) {
  const i = rows.findIndex((r) => r.id === id);
  if (i >= 0) rows.splice(i, 1);
}
