import express from 'express';
import { can, requirePermission } from './rbac.js';

// Stand-in for real authentication (sessions, JWTs...): a fixed token per user.
export const USERS = {
  'viewer-token': { id: 'u1', name: 'Vera', role: 'viewer' },
  'editor-token': { id: 'u2', name: 'Ed', role: 'editor' },
  'editor2-token': { id: 'u3', name: 'Edna', role: 'editor' },
  'admin-token': { id: 'u4', name: 'Ada', role: 'admin' },
};

export function createApp() {
  const app = express();
  app.use(express.json());
  const posts = new Map([
    ['p1', { id: 'p1', authorId: 'u2', title: 'Hello' }],
    ['p2', { id: 'p2', authorId: 'u3', title: 'Second post' }],
  ]);
  let nextId = 3;

  // Authentication: who are you? Sets req.user, or leaves it undefined.
  app.use((req, res, next) => {
    const [, token] = (req.get('authorization') ?? '').split(' ');
    req.user = USERS[token];
    next();
  });

  // Authorization: what may you do? TODO 4: protect every route below with
  // requirePermission(...) using the permissions from the README.

  app.get('/posts', (req, res) => res.json([...posts.values()]));

  app.post('/posts', (req, res) => {
    const post = { id: `p${nextId++}`, authorId: req.user.id, title: String(req.body.title ?? 'Untitled') };
    posts.set(post.id, post);
    res.status(201).json(post);
  });

  app.put('/posts/:id', (req, res) => {
    const post = posts.get(req.params.id);
    if (!post) return res.status(404).json({ error: 'not found' });
    // TODO 5: ownership. Editors may only edit their OWN posts. Anyone with
    // posts:update:any (admins) may edit any post. Otherwise 403.
    post.title = String(req.body.title ?? post.title);
    res.json(post);
  });

  app.delete('/posts/:id', (req, res) => {
    if (!posts.delete(req.params.id)) return res.status(404).json({ error: 'not found' });
    res.status(204).end();
  });

  app.get('/admin/users', (req, res) => res.json(Object.values(USERS)));

  return app;
}
