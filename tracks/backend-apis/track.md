# Track: Backend APIs

Building HTTP APIs in Node: Express and NestJS, sessions, OpenAPI docs,
pagination, real-time push, and two ways of querying data (GROQ and an
ORM). Each challenge is small, about 10–30 minutes.

## Requirements
Node.js 20+ and network access to the npm registry. Each challenge's setup
installs what it needs (`express`, `ws`, `@nestjs/*`, `groq-js`,
`drizzle-orm`…). Challenge 08 uses `better-sqlite3`, a native module. It
normally downloads a prebuilt binary. If that isn't possible, it compiles from
source and needs `python3`, `make` and a C++ compiler.

## Learning objectives
By the end you can:
- Structure an Express app with routers, middleware, a 404 fallback and an error handler.
- Run cookie sessions safely: `HttpOnly`/`SameSite`/`Secure`, regenerate on login, destroy on logout.
- Document an API with OpenAPI, serve Swagger UI, and keep the spec in sync with the code.
- Implement offset and cursor pagination, and explain why offset breaks when data changes.
- Push updates with Server-Sent Events and WebSockets.
- Build a NestJS feature: module, controller, injected service and a validated DTO.
- Query a content dataset with GROQ.
- Define tables, generate and apply migrations, and query with an ORM (Drizzle).

## Challenges (do them in order)
| # | Challenge | Core concepts |
|---|-----------|---------------|
| 01 | express-basics | `Router`, params, `express.json()`, middleware, 404, error handler |
| 02 | sessions-and-cookies | `express-session`, cookie flags, session fixation, logout |
| 03 | openapi-swagger | OpenAPI 3, `$ref`/components, `swagger-ui-express`, spec ↔ code drift |
| 04 | pagination | `LIMIT`/`OFFSET`, keyset cursors, opaque cursors, duplicates and skips |
| 05 | websockets-and-sse | `text/event-stream`, the `ws` library, broadcasting, disconnects |
| 06 | nestjs | `@Module`, `@Controller`, `@Injectable`, DTOs, `ValidationPipe`, `ParseIntPipe` |
| 07 | groq | filters, projections, `order`, slices, `->`, `$params`, `^`, drafts |
| 08 | orm-drizzle | schema in code, `drizzle-kit generate`, migrations, joins, `count`/`groupBy` |

Challenges 01–06 are each a small server you can run with `npm start` and
poke with `curl`.

Start with: `./onboard start backend-apis/01`
