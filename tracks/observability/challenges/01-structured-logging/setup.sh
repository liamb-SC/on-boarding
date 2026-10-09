#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset
printf 'node_modules/\n' | put .gitignore
put package.json <<'JSON'
{
  "name": "checkout-service",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node demo.js"
  },
  "dependencies": {
    "pino": "^10.0.0"
  }
}
JSON

put logger.js <<'JS'
import pino from 'pino';

// TODO: return a pino logger that
//   - takes its level from the LOG_LEVEL env var, defaulting to 'info'
//   - adds service: 'checkout' to every line
//   - redacts card.number, so a card number can never end up in the logs
export function createLogger(destination = process.stdout) {
  return pino(destination);
}
JS

put payments.js <<'JS'
// A fake payment provider. Cards ending in 0002 are declined.
let next = 1000;
export async function chargeCard(card, amount) {
  await new Promise((r) => setTimeout(r, 5));
  if (String(card?.number).endsWith('0002')) throw new Error('card declined by issuer');
  return { orderId: `ord_${next++}`, amount };
}
JS

put checkout.js <<'JS'
import { randomUUID } from 'node:crypto';
import { chargeCard } from './payments.js';

// Handles one "POST /orders" request:
//   req = { headers: {...}, body: { items: [{ sku, price }], card: { number, expiry } } }
// and returns { status, headers, body }.
export async function placeOrder(logger, req) {
  // TODO: replace every console.log with structured logging (see the README)
  console.log('placing order ' + JSON.stringify(req.body));
  const { items = [], card } = req.body;

  if (items.length === 0) {
    console.log('order rejected: empty cart');
    return { status: 400, headers: {}, body: { error: 'empty cart' } };
  }

  const total = items.reduce((sum, item) => sum + item.price, 0);
  try {
    const { orderId } = await chargeCard(card, total);
    console.log('order ' + orderId + ' placed, total ' + total);
    return { status: 201, headers: {}, body: { orderId } };
  } catch (err) {
    console.log('payment failed: ' + err.message);
    return { status: 502, headers: {}, body: { error: 'payment failed' } };
  }
}
JS

put demo.js <<'JS'
// npm start — three requests through placeOrder. Try: LOG_LEVEL=debug npm start
// Pretty output while developing: npm start | npx pino-pretty
import { createLogger } from './logger.js';
import { placeOrder } from './checkout.js';

const logger = createLogger();
const card = { number: '4242424242424242', expiry: '12/30' };
await placeOrder(logger, { headers: { 'x-request-id': 'req-from-the-gateway' }, body: { items: [{ sku: 'mug', price: 899 }], card } });
await placeOrder(logger, { headers: {}, body: { items: [], card } });
await placeOrder(logger, { headers: {}, body: { items: [{ sku: 'tee', price: 1599 }], card: { ...card, number: '4000000000000002' } } });
JS

npm_install_sandbox
sb_commit_all "checkout service with console.log debugging"
