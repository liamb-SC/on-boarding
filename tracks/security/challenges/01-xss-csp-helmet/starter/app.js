import { fileURLToPath } from 'node:url';
import express from 'express';
import { escapeHtml } from './html.js';

export function createApp() {
  const app = express();
  const entries = [{ name: 'Ada', message: 'Hello from the first guest!' }];

  // TODO 2: add security headers with helmet (it sets a Content-Security-Policy too).

  app.use(express.urlencoded({ extended: false }));
  app.use(express.static(fileURLToPath(new URL('./public', import.meta.url))));

  app.get('/', (req, res) => {
    const q = String(req.query.q ?? '');
    const shown = entries.filter((e) => e.message.includes(q));
    // Everything below is built by string concatenation. Any user input that
    // lands in here unescaped is a script injection waiting to happen.
    res.send(`<!doctype html>
<html>
<head><meta charset="utf-8"><title>Guestbook</title></head>
<body>
  <h1>Guestbook</h1>
  <form method="get" action="/">
    <input name="q" value="${q}"><button>Search</button>
  </form>
  ${q ? `<p>Results for ${q}</p>` : ''}
  <ul>
    ${shown.map((e) => `<li><b>${e.name}</b>: ${e.message}</li>`).join('\n    ')}
  </ul>
  <form method="post" action="/entries">
    <input name="name" placeholder="Your name">
    <textarea name="message" placeholder="Say hello"></textarea>
    <button>Sign</button>
  </form>
  <button id="clear" onclick="document.querySelector('textarea').value = ''">Clear</button>
  <script>console.log('guestbook loaded');</script>
</body>
</html>`);
  });

  app.post('/entries', (req, res) => {
    entries.push({ name: String(req.body.name ?? ''), message: String(req.body.message ?? '') });
    res.redirect(303, '/');
  });

  return app;
}
