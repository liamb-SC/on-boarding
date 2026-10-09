import { calls } from './api.js';
import { loadDashboard, loadMany, safeLoad } from './dashboard.js';

let t = Date.now();
console.log('dashboard:', await loadDashboard(1), `${Date.now() - t}ms`);

t = Date.now();
try {
  console.log('many:', await loadMany([1, 2, 99, -1]), `${Date.now() - t}ms`);
} catch (err) {
  console.log('many: threw', err.message);
}

console.log('safeLoad(3):', await safeLoad(3));
try {
  console.log('safeLoad(99):', await safeLoad(99));
} catch (err) {
  console.log('safeLoad(99): threw', err.message);
}
console.log('API calls made:', calls.total, 'max at once:', calls.maxInFlight);
