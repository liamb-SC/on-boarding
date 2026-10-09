import { config } from './config.js';

console.log(`payments-service would start on :${config.port}`);
console.log(`database host: ${new URL(config.databaseUrl).host}`); // never log the whole URL: it has the password
