import ReduxCart from './components/ReduxCart.jsx';
import ZustandCart from './components/ZustandCart.jsx';

export default function App() {
  return (
    <main style={{ display: 'flex', gap: '3rem' }}>
      <section><h2>Redux Toolkit</h2><ReduxCart /></section>
      <section><h2>Zustand</h2><ZustandCart /></section>
    </main>
  );
}
