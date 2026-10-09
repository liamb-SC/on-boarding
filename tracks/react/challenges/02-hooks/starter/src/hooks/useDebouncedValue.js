// useDebouncedValue(value, delay): returns `value`, but only once it has
// stopped changing for `delay` milliseconds. Until then it returns the
// previous settled value (the very first render returns `value` as-is).
export function useDebouncedValue(value, delay) {
  // TODO: useState + useEffect (+ a cleanup that cancels the pending timer)
  return value;
}
