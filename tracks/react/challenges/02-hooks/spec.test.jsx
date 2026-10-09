// Validator-owned spec: staged into the sandbox by check.mjs on each validate.
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Counter from '../src/components/Counter.jsx';
import Search from '../src/components/Search.jsx';
import { useDebouncedValue } from '../src/hooks/useDebouncedValue.js';
import { useDocumentTitle } from '../src/hooks/useDocumentTitle.js';

afterEach(() => { cleanup(); vi.useRealTimers(); });

test('Counter: +1 updates the count on screen (useState)', async () => {
  render(<Counter />);
  await userEvent.click(screen.getByRole('button', { name: '+1' }));
  await userEvent.click(screen.getByRole('button', { name: '+1' }));
  expect(screen.getByText('Count: 2')).toBeTruthy();
});

test('Counter: +3 adds three (increment uses a functional update)', async () => {
  render(<Counter />);
  await userEvent.click(screen.getByRole('button', { name: '+3' }));
  expect(screen.getByText('Count: 3')).toBeTruthy();
});

test('Counter: Reset goes back to 0', async () => {
  render(<Counter />);
  await userEvent.click(screen.getByRole('button', { name: '+3' }));
  expect(screen.getByText('Count: 3')).toBeTruthy();
  await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
  expect(screen.getByText('Count: 0')).toBeTruthy();
});

test('useDocumentTitle: sets document.title and updates it when the title changes', () => {
  document.title = 'Original';
  const { rerender, unmount } = renderHook(({ t }) => useDocumentTitle(t), { initialProps: { t: 'Inbox (1)' } });
  expect(document.title).toBe('Inbox (1)');
  rerender({ t: 'Inbox (2)' });
  expect(document.title).toBe('Inbox (2)');
  unmount();
});

test('useDocumentTitle: restores the previous title on unmount (effect cleanup)', () => {
  document.title = 'Original';
  const { unmount } = renderHook(() => useDocumentTitle('Temporary'));
  expect(document.title).toBe('Temporary');
  unmount();
  expect(document.title).toBe('Original');
});

test('useDebouncedValue: returns the first value immediately', () => {
  const { result } = renderHook(() => useDebouncedValue('a', 300));
  expect(result.current).toBe('a');
});

test('useDebouncedValue: only updates after the value settles for `delay` ms', () => {
  vi.useFakeTimers();
  const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), { initialProps: { v: 'r' } });
  rerender({ v: 're' });
  act(() => { vi.advanceTimersByTime(200); });
  rerender({ v: 'rea' });
  act(() => { vi.advanceTimersByTime(200); });
  expect(result.current, 'changed before 300ms of quiet').toBe('r');
  act(() => { vi.advanceTimersByTime(100); });
  expect(result.current).toBe('rea');
});

test('useDebouncedValue: cancels its pending timer on unmount', () => {
  vi.useFakeTimers();
  const { result, rerender, unmount } = renderHook(({ v }) => useDebouncedValue(v, 300), { initialProps: { v: 'a' } });
  rerender({ v: 'ab' });
  expect(result.current, 'changed before the delay passed').toBe('a');
  unmount();
  expect(vi.getTimerCount(), 'a timer was still pending after unmount').toBe(0);
});

test('Search: typing calls onSearch once with the settled text, not per keystroke', () => {
  vi.useFakeTimers();
  const onSearch = vi.fn();
  render(<Search onSearch={onSearch} />);
  const input = screen.getByLabelText('Search');
  for (const text of ['r', 're', 'rea', 'react']) {
    fireEvent.change(input, { target: { value: text } });
    act(() => { vi.advanceTimersByTime(100); });
  }
  expect(onSearch).not.toHaveBeenCalled();
  act(() => { vi.advanceTimersByTime(300); });
  expect(onSearch).toHaveBeenCalledTimes(1);
  expect(onSearch).toHaveBeenCalledWith('react');
  expect(input.value).toBe('react');
});

test('Search: the tab title shows the settled search ("Search: react")', () => {
  vi.useFakeTimers();
  render(<Search onSearch={() => {}} />);
  fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'react' } });
  act(() => { vi.advanceTimersByTime(300); });
  expect(document.title).toBe('Search: react');
});
