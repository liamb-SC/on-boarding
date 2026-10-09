import { INestApplication } from '@nestjs/common';

// App-wide setup, shared by main.ts and the validator.
export function configureApp(app: INestApplication) {
  // TODO 5: turn on DTO validation for every route with a global ValidationPipe:
  //   - whitelist: true             strip properties the DTO doesn't declare...
  //   - forbidNonWhitelisted: true  ...or rather, reject them with a 400
  //   - transform: true             give handlers real DTO class instances
}
