import { Button } from './components/ui/button.jsx';
import NewsletterSignup from './components/NewsletterSignup.jsx';

export default function App() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 32 }}>
      <section>
        <h2>shadcn/ui (copied-in source + Tailwind)</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button>Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Delete</Button>
          <Button variant="success">Saved</Button>
        </div>
      </section>
      <section>
        <h2>Material UI (an installed library + a theme)</h2>
        <NewsletterSignup />
      </section>
    </main>
  );
}
