import { useState } from 'react';
// TODO: import TextField, Button and Alert from '@mui/material'

// A newsletter box built from MUI components:
//   - a TextField labelled "Email"
//   - a contained Button "Subscribe"
//   - submitting an email without "@" puts the TextField in its error state
//     with helper text "Enter a valid email"
//   - a valid email swaps the form for a success Alert: "Subscribed <email>"
export default function NewsletterSignup() {
  const [email, setEmail] = useState('');

  return (
    <form>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <button type="submit">Subscribe</button>
    </form>
  );
}
