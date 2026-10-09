// Run with: node invoke.mjs '{"items":[{"sku":"MUG-01","qty":2,"price":8.5}]}'
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { config } from './aws.mjs';

const lambda = new LambdaClient(config);
const payload = process.argv[2] ?? '{}';

// Invoke "order-total" with `payload`, then print the result. The response's
// Payload is bytes: decode it with new TextDecoder().decode(...). If the
// function threw, the response also has a FunctionError field.
