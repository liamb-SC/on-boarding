import { Controller, Get } from '@nestjs/common';
import { TodosService } from './todos.service';

// The controller maps HTTP routes to service calls. Keep it thin.
@Controller('todos')
export class TodosController {
  // Dependency injection: Nest passes in the TodosService instance.
  constructor(private readonly todos: TodosService) {}

  @Get()
  findAll() {
    return this.todos.findAll();
  }

  // TODO 3:
  //   GET  /todos/:id  -> findOne. Turn the :id string into a number with
  //                       ParseIntPipe (so /todos/abc is a 400, not a 404)
  //   POST /todos      -> create from a CreateTodoDto @Body() (Nest replies 201)
}
