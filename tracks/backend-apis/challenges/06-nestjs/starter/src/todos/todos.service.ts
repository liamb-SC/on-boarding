import { Injectable } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { Todo } from './todo';

// The service holds the logic and data. @Injectable() lets Nest create one
// instance and hand it to whoever asks for it in their constructor.
@Injectable()
export class TodosService {
  private todos: Todo[] = [{ id: 1, title: 'Learn NestJS', done: false }];
  private nextId = 2;

  findAll(): Todo[] {
    return this.todos;
  }

  // TODO 1:
  //   findOne(id: number): Todo     -> throw new NotFoundException(...) if missing
  //   create(dto: CreateTodoDto): Todo  -> { id: nextId++, title, done: dto.done ?? false }
}
