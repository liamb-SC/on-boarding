import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

// A search box that only searches once the user pauses typing.
export default function Search({ onSearch }) {
  // TODO: hold the input's text in state, debounce it by 300ms, set the tab
  // title, and call onSearch(debounced) whenever the debounced text changes
  // (but not while it's empty).
  return (
    <label>
      Search <input type="search" />
    </label>
  );
}
