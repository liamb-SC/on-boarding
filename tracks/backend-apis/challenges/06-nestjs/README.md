# 06 · NestJS: module, controller, service, DTO

**Skills:** `@Module`, `@Controller` + route decorators, `@Injectable`
services and constructor injection, DTOs with `class-validator`, the global
`ValidationPipe`, `ParseIntPipe`, built-in HTTP exceptions.

## Background
**NestJS** is an opinionated framework on top of Express, written in
TypeScript. Where Express leaves the structure up to you, Nest gives every
feature the same shape:

```
todos/
  todos.module.ts       @Module({ controllers, providers }): wires the feature together
  todos.controller.ts   @Controller('todos'): HTTP in/out, stays thin
  todos.service.ts      @Injectable(): the logic, injected into the controller
  dto/create-todo.dto.ts  the request body's shape + validation rules
```

- **Dependency injection:** `constructor(private readonly todos: TodosService)`.
  Nest sees the type, creates one `TodosService` and passes it in. You never
  call `new`.
- **DTO validation:** decorators such as `@IsString()` describe the rules, and
  a `ValidationPipe` enforces them before your handler runs. Invalid input
  becomes a `400` automatically.
- **Exceptions** like `NotFoundException` become the matching HTTP status.

## Scenario
A todos API. `findAll` and `GET /todos` work, but the module isn't wired up,
the DTO is empty and validation is off.

## Goal
Follow `TODO 1`–`5` across `src/`:
1. `TodosService.findOne` (throws `NotFoundException`) and `create`.
2. `CreateTodoDto`: `title` is a required, non-empty string of at most 100
   characters, and `done` is an optional boolean.
3. `GET /todos/:id` (with `ParseIntPipe`) and `POST /todos`.
4. `TodosModule`, imported by `AppModule`.
5. A global `ValidationPipe` in `configure.ts` that rejects unknown
   properties.

## Try it
```bash
npm start      # builds with tsc, then runs dist/main.js on :3000
curl -i localhost:3000/todos -H 'content-type: application/json' -d '{"title":"hi"}'
curl -i localhost:3000/todos -H 'content-type: application/json' -d '{"title":"","isAdmin":true}'
```

## Hints
- `@Get(':id') findOne(@Param('id', ParseIntPipe) id: number)`.
- `@Post() create(@Body() dto: CreateTodoDto)`.
- `title!: string;` with the decorators stacked above it. The `!` tells
  TypeScript that the value is set from outside.
- If you have the Nest CLI, `nest g resource` generates all of this, but write
  it by hand once.

## Check your work
```
./onboard validate backend-apis/06
```
