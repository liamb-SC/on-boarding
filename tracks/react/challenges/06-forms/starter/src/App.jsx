import SignupForm from './SignupForm.jsx';

export default function App() {
  return (
    <main>
      <h1>Create your account</h1>
      <SignupForm onSubmit={(values) => alert(JSON.stringify(values, null, 2))} />
    </main>
  );
}
