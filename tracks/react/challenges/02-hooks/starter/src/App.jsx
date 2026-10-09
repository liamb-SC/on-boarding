import Counter from './components/Counter.jsx';
import Search from './components/Search.jsx';

export default function App() {
  return (
    <main>
      <Counter />
      <hr />
      <Search onSearch={(q) => console.log('searching for', q)} />
    </main>
  );
}
