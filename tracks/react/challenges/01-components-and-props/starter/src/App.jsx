import Card from './components/Card.jsx';
import TeamList from './components/TeamList.jsx';

const TEAM = [
  { id: 'ada', name: 'Ada Lovelace', role: 'Tech Lead', isLead: true },
  { id: 'grace', name: 'Grace Hopper', role: 'Platform Engineer' },
  { id: 'alan', name: 'Alan Turing' }, // no role: should show the default
];

export default function App() {
  return (
    <main>
      <Card title="Payments team">
        <TeamList members={TEAM} onSelect={(id) => alert(`You picked ${id}`)} />
      </Card>
      <Card title="New team">
        <TeamList members={[]} onSelect={() => {}} />
      </Card>
    </main>
  );
}
