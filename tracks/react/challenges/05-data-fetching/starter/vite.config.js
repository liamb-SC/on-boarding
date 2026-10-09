// Vite compiles JSX with esbuild, so no plugin is needed for this small app.
// The fakeApi plugin below gives `npm run dev` a slow little /api/users
// backend so you can watch loading states and refetches happen.
import { defineConfig } from 'vite';

function fakeApi() {
  const users = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }];
  const send = (res, status, body) => setTimeout(() => {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(body));
  }, 600);
  return {
    name: 'fake-api',
    configureServer(server) {
      server.middlewares.use('/api/users', (req, res) => {
        if (req.method === 'GET') return send(res, 200, users);
        let raw = '';
        req.on('data', (c) => { raw += c; });
        req.on('end', () => {
          const user = { id: users.length + 1, name: JSON.parse(raw || '{}').name };
          users.push(user);
          send(res, 201, user);
        });
      });
    },
  };
}

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  plugins: [fakeApi()],
  test: { environment: 'jsdom' },
});
