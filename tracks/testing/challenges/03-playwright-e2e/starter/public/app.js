// A tiny todo app. State lives in memory, so a reload starts empty.
const todos = [];
let filter = 'all';
const list = document.getElementById('todo-list');
const count = document.getElementById('count');
const input = document.getElementById('new-todo');

function render() {
  const visible = todos.filter((t) =>
    filter === 'all' || (filter === 'active' ? !t.done : t.done));
  list.replaceChildren(...visible.map((todo) => {
    const li = document.createElement('li');
    li.className = todo.done ? 'done' : '';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = todo.done;
    box.id = `todo-${todo.id}`;
    box.addEventListener('change', () => { todo.done = box.checked; render(); });
    const label = document.createElement('label');
    label.htmlFor = box.id;
    label.textContent = todo.text;
    li.append(box, label);
    return li;
  }));
  const left = todos.filter((t) => !t.done).length;
  count.textContent = `${left} ${left === 1 ? 'item' : 'items'} left`;
  for (const a of document.querySelectorAll('nav a')) {
    a.toggleAttribute('aria-current', a.dataset.filter === filter);
  }
}

document.getElementById('add-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (text) todos.push({ id: todos.length + 1, text, done: false });
  input.value = '';
  render();
});

for (const a of document.querySelectorAll('nav a')) {
  a.addEventListener('click', () => { filter = a.dataset.filter; render(); });
}

render();
