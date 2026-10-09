// npm start: two services plus the gateway on :8080.
//   curl -i localhost:8080/users/42 -H 'x-api-key: key-alice'
import { createService } from './services.js';
import { createGateway } from './gateway.js';

createService('users').listen(4001);
createService('orders').listen(4002);
createGateway({
  routes: { '/users': 'http://127.0.0.1:4001', '/orders': 'http://127.0.0.1:4002' },
  apiKeys: { 'key-alice': 'alice', 'key-bob': 'bob' },
  rateLimit: { limit: 5, windowMs: 10_000 },
}).listen(8080, () => console.log('gateway on http://localhost:8080 (keys: key-alice, key-bob)'));
