// A DTO (data transfer object) describes the request body. The decorators from
// class-validator are the rules the ValidationPipe enforces.
// import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTodoDto {
  // TODO 2:
  //   title: required, a non-empty string, at most 100 characters
  //   done:  optional boolean
}
