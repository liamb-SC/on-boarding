// Validator-owned spec: staged into the sandbox by check.mjs on each validate.
import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import { Button } from '../src/components/ui/button.jsx';
import NewsletterSignup from '../src/components/NewsletterSignup.jsx';
import { theme } from '../src/theme.js';

afterEach(cleanup);

const classes = (el) => el.className.split(/\s+/);

// ---- shadcn/ui: the code is yours to change ------------------------------

test('shadcn Button: has a "success" variant (bg-green-600 text-white hover:bg-green-700)', () => {
  render(<Button variant="success">Saved</Button>);
  const c = classes(screen.getByRole('button', { name: 'Saved' }));
  for (const want of ['bg-green-600', 'text-white', 'hover:bg-green-700']) {
    expect(c, `missing class ${want}`).toContain(want);
  }
  expect(c, 'the shared base classes are missing').toContain('inline-flex');
});

test('shadcn Button: the existing variants and the default still work', () => {
  render(<><Button>Plain</Button><Button variant="destructive">Delete</Button></>);
  expect(classes(screen.getByRole('button', { name: 'Plain' }))).toContain('bg-primary');
  expect(classes(screen.getByRole('button', { name: 'Delete' }))).toContain('bg-destructive');
});

test('shadcn Button: a className passed in still overrides the variant (cn + tailwind-merge)', () => {
  render(<Button variant="success" className="bg-green-800">Custom</Button>);
  const c = classes(screen.getByRole('button', { name: 'Custom' }));
  expect(c).toContain('bg-green-800');
  expect(c).not.toContain('bg-green-600');
  expect(c).toContain('text-white');
});

// ---- Material UI: an installed library, styled by a theme -----------------

const signup = () => render(<ThemeProvider theme={theme}><NewsletterSignup /></ThemeProvider>);

test('MUI theme: the primary colour is #6c2bd9', () => {
  expect(theme.palette.primary.main.toLowerCase()).toBe('#6c2bd9');
});

test('MUI: the form uses a TextField labelled "Email" and a contained Button', () => {
  signup();
  const input = screen.getByLabelText('Email');
  expect(input.closest('.MuiTextField-root'), 'the Email input is not an MUI TextField').toBeTruthy();
  expect(classes(screen.getByRole('button', { name: 'Subscribe' }))).toContain('MuiButton-contained');
});

test('MUI: an email without "@" shows the TextField error state + helper text', async () => {
  signup();
  await userEvent.type(screen.getByLabelText('Email'), 'nope');
  await userEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
  expect(screen.getByText('Enter a valid email')).toBeTruthy();
  expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe('true');
  expect(screen.queryByRole('alert')).toBeNull();
});

test('MUI: a valid email shows a success Alert "Subscribed <email>"', async () => {
  signup();
  await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
  const alert = screen.getByRole('alert');
  expect(alert.textContent).toContain('Subscribed ada@example.com');
  const c = classes(alert);
  expect(c.includes('MuiAlert-colorSuccess') || c.includes('MuiAlert-standardSuccess'),
    'the alert is not an MUI Alert with severity="success"').toBe(true);
  expect(screen.queryByLabelText('Email'), 'the form should be replaced by the alert').toBeNull();
});
