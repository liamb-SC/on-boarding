// An in-memory "database". createStore() gives each app its own copy.
export function createStore() {
  const notes = [
    { id: 1, text: 'Buy milk' },
    { id: 2, text: 'Read the Express docs' },
  ];
  let nextId = 3;
  return {
    list: () => notes,
    get: (id) => notes.find((n) => n.id === id),
    add(text) {
      const note = { id: nextId++, text };
      notes.push(note);
      return note;
    },
  };
}
