// Role-based access control: users have a ROLE, roles grant PERMISSIONS, and
// routes ask for a permission (never a role). Adding a role or moving a
// permission is then a one-line change here instead of a hunt through routes.

// TODO 1: fill in the table from the README.
export const ROLE_PERMISSIONS = {
  viewer: [],
  editor: [],
  admin: [],
};

// can(user, permission) -> true only if the user's role grants it.
// Deny by default: no user, an unknown role or an unknown permission -> false.
export function can(user, permission) {
  // TODO 2
  return true;
}

// requirePermission(permission) -> Express middleware.
//   no req.user              -> 401 { error: 'unauthenticated' }
//   req.user lacks it        -> 403 { error: 'forbidden' }
//   otherwise                -> next()
export function requirePermission(permission) {
  // TODO 3
  return (req, res, next) => next();
}
