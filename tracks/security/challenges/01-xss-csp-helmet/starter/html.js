// escapeHtml(value) — make any value safe to drop into HTML text OR a quoted
// attribute. Convert it to a string, then replace the five characters that
// mean something to an HTML parser:
//   &  ->  &amp;     (do this one first. Why?)
//   <  ->  &lt;
//   >  ->  &gt;
//   "  ->  &quot;
//   '  ->  &#39;
export function escapeHtml(value) {
  // TODO 1
  return String(value);
}
