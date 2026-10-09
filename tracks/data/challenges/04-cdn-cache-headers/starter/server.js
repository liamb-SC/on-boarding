// The origin server that sits behind our CDN. It serves four kinds of
// response, and each one needs different caching headers.
import http from 'node:http';
import { createHash } from 'node:crypto';

const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Kettle', price: 30 },
  { id: 2, name: 'Toaster', price: 45 },
];

export function createServer({ products = DEFAULT_PRODUCTS } = {}) {
  return http.createServer((req, res) => {
    const send = (status, type, body, headers = {}) => {
      res.writeHead(status, { 'content-type': type, ...headers });
      res.end(body);
    };

    // The HTML page. Its URL never changes, but its content changes on every deploy.
    if (req.url === '/') {
      return send(200, 'text/html', '<script src="/assets/app.3f9a1c.js"></script>');
    }

    // A fingerprinted asset: the hash in the file name changes whenever the content does.
    if (req.url === '/assets/app.3f9a1c.js') {
      return send(200, 'text/javascript', 'console.log("shop")');
    }

    // Public data shared by every visitor; it changes a few times a day.
    if (req.url === '/api/products') {
      return send(200, 'application/json', JSON.stringify(products));
    }

    // The signed-in user's own data.
    if (req.url === '/api/me') {
      return send(200, 'application/json', JSON.stringify({ name: 'Ada', basket: 3 }));
    }

    send(404, 'text/plain', 'not found');
  });
}

// Helpful for ETags: a short, stable fingerprint of a response body.
export const fingerprint = (body) => createHash('sha1').update(body).digest('base64url').slice(0, 16);
