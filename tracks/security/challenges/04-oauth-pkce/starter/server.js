import { createApp } from './app.js';

// Run `npm run auth-server` in another terminal first.
const port = process.env.PORT ?? 3000;
createApp({
  authServerUrl: process.env.AUTH_SERVER_URL ?? 'http://localhost:9000',
  redirectUri: `http://localhost:${port}/callback`,
}).listen(port, () => console.log(`Notes app on http://localhost:${port}. Open /login in a browser.`));
