// Validator-owned spec: staged into the sandbox by check.mjs on each validate.
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Card from '../src/components/Card.jsx';
import TeamMember from '../src/components/TeamMember.jsx';
import TeamList from '../src/components/TeamList.jsx';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const TEAM = [
  { id: 'a', name: 'Ada Lovelace', role: 'Tech Lead', isLead: true },
  { id: 'g', name: 'Grace Hopper', role: 'Platform Engineer' },
  { id: 't', name: 'Alan Turing' },
];

test('Card: renders its title as an <h2> heading', () => {
  render(<Card title="Payments team"><p>inside</p></Card>);
  expect(screen.getByRole('heading', { level: 2, name: 'Payments team' })).toBeTruthy();
});

test('Card: renders whatever is nested inside it (children)', () => {
  render(<Card title="x"><p>hello from a child</p><button>and another</button></Card>);
  expect(screen.getByText('hello from a child')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'and another' })).toBeTruthy();
});

test('TeamMember: shows the name (as an <h3>) and role from props', () => {
  render(<TeamMember name="Grace Hopper" role="Platform Engineer" />);
  expect(screen.getByRole('heading', { level: 3, name: 'Grace Hopper' })).toBeTruthy();
  expect(screen.getByText('Platform Engineer')).toBeTruthy();
});

test('TeamMember: role defaults to "Engineer" when not passed', () => {
  render(<TeamMember name="Alan Turing" />);
  expect(screen.getByText('Engineer')).toBeTruthy();
});

test('TeamMember: shows a "Lead" badge only when isLead is true', () => {
  render(<TeamMember name="Ada Lovelace" role="Tech Lead" isLead />);
  expect(screen.getByText('Lead')).toBeTruthy();
  cleanup();
  render(<TeamMember name="Grace Hopper" role="Platform Engineer" />);
  expect(screen.queryByText('Lead')).toBeNull();
});

test('TeamList: renders one <li> per member, each with their TeamMember card', () => {
  render(<TeamList members={TEAM} onSelect={() => {}} />);
  const items = screen.getAllByRole('listitem');
  expect(items).toHaveLength(3);
  expect(within(items[2]).getByRole('heading', { name: 'Alan Turing' })).toBeTruthy();
  expect(within(items[2]).getByText('Engineer')).toBeTruthy();
});

test('TeamList: gives every <li> a unique key (no React key warning)', () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  render(<TeamList members={TEAM} onSelect={() => {}} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
  const keyWarnings = errors.mock.calls.filter((c) => c.join(' ').includes('"key"'));
  expect(keyWarnings, 'React warned: each child in a list should have a unique "key" prop').toHaveLength(0);
});

test('TeamList: an empty list shows "No team members yet" and no <ul>', () => {
  render(<TeamList members={[]} onSelect={() => {}} />);
  expect(screen.getByText('No team members yet')).toBeTruthy();
  expect(screen.queryByRole('list')).toBeNull();
});

test('TeamList: clicking "View <name>" calls onSelect with that member\'s id', async () => {
  const onSelect = vi.fn();
  render(<TeamList members={TEAM} onSelect={onSelect} />);
  await userEvent.click(screen.getByRole('button', { name: 'View Grace Hopper' }));
  expect(onSelect).toHaveBeenCalledWith('g');
  expect(onSelect).toHaveBeenCalledTimes(1);
});
