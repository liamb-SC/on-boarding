import AddUser from './components/AddUser.jsx';
import UsersQuery from './components/UsersQuery.jsx';
import UsersSWR from './components/UsersSWR.jsx';

export default function App() {
  return (
    <main style={{ display: 'flex', gap: '3rem' }}>
      <section><h2>SWR</h2><UsersSWR /></section>
      <section><h2>TanStack Query</h2><UsersQuery /><AddUser /></section>
    </main>
  );
}
