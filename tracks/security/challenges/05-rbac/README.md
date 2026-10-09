# 05 · Role-based access control (RBAC)

**Skills:** authentication vs authorization, roles → permissions, permission
middleware, 401 vs 403, deny by default, ownership checks.

## Background
- **Authentication** answers "who are you?" (a session, a JWT).
  **Authorization** answers "what may you do?".
- **RBAC:** users get a **role**, roles grant **permissions**, and routes
  require a *permission*, never a role name. `requirePermission('posts:delete')`
  still reads correctly when you add a `moderator` role later.
  `if (user.role === 'admin')` scattered through handlers doesn't.
- **401 Unauthorized** means "I don't know who you are, log in".
  **403 Forbidden** means "I know who you are, and the answer is no".
- **Deny by default:** a missing user, an unknown role or a typo'd permission
  must all come out as *no*.
- Roles alone can't express "editors may edit **their own** posts". That's
  an **ownership** (attribute-based) check, done in the handler once you've
  loaded the resource.

## Scenario
`app.js` is a blog API with a stub login (fixed Bearer tokens per user). Every
route is open to everyone, and `rbac.js` is a stub.

## Goal
1. In `rbac.js`, fill in `ROLE_PERMISSIONS`:

   | Role | Permissions |
   |------|-------------|
   | viewer | `posts:read` |
   | editor | `posts:read`, `posts:create`, `posts:update` |
   | admin | everything an editor has, plus `posts:update:any`, `posts:delete`, `users:manage` |

2. Implement `can(user, permission)` (deny by default) and
   `requirePermission(permission)` (401 without a user, 403 without the
   permission).
3. In `app.js`, protect every route: `GET /posts` → `posts:read`,
   `POST /posts` → `posts:create`, `PUT /posts/:id` → `posts:update`,
   `DELETE /posts/:id` → `posts:delete`, `GET /admin/users` → `users:manage`.
4. In `PUT /posts/:id`, return 403 unless the user wrote the post or has
   `posts:update:any`.

## Try it
```bash
npm start
curl -si localhost:3000/posts                                        # 401
curl -si localhost:3000/posts -H 'authorization: Bearer viewer-token' # 200
curl -si -X DELETE localhost:3000/posts/p1 -H 'authorization: Bearer editor-token'  # 403
```

## Hints
- Middleware runs in order. `app.get('/posts', requirePermission('posts:read'), handler)`.
- `ROLE_PERMISSIONS['constructor']` is *not* undefined: every object inherits
  one. Use `Object.hasOwn(ROLE_PERMISSIONS, role)`, or build the table with
  `Object.create(null)` / a `Map`.

## Check your work
```
./onboard validate security/05
```
