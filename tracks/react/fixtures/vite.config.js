// Vite compiles JSX with esbuild, so no plugin is needed for this small app.
// `npm run dev` serves index.html; `npm test` runs any *.test.jsx you write.
import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: { environment: 'jsdom' },
});
