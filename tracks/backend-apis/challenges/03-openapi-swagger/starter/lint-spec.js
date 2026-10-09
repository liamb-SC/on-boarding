// npm run lint:spec: validates openapi.json against the OpenAPI 3 schema
// (structure, $refs, path parameters...). It can't tell you whether the spec
// matches the code, though. That's your job (and the validator's).
import SwaggerParser from '@apidevtools/swagger-parser';

try {
  const api = await SwaggerParser.validate('openapi.json');
  console.log(`✓ ${api.info.title} ${api.info.version} is a valid OpenAPI ${api.openapi} document`);
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exit(1);
}
