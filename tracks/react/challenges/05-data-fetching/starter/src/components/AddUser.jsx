import { useState } from 'react';
import { createUser } from '../api.js';

// Adds a user with a TanStack mutation. On success it clears the input and
// tells the cache that ['users'] is stale, so every list showing users
// refetches.
export default function AddUser() {
  const [name, setName] = useState('');
  // TODO: useQueryClient + useMutation

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: run the mutation with `name`
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {/* TODO: disable while the mutation is pending */}
      <button type="submit">Add user</button>
    </form>
  );
}
