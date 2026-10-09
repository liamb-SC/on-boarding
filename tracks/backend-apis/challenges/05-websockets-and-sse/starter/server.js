import http from 'node:http';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';

export function createServer() {
  const app = express();
  app.use(express.json());
  app.use(express.static(fileURLToPath(new URL('./public', import.meta.url))));
  const server = http.createServer(app);

  const sseClients = new Set(); // the `res` of every open GET /events
  let nextId = 1;

  // Send one chat message to EVERYONE: all SSE clients and all WebSocket clients.
  function broadcast(text) {
    const message = { type: 'message', id: nextId++, text };
    // TODO 3: write it to every SSE client as an event:
    //   id: <message.id>
    //   event: message
    //   data: <JSON.stringify(message)>
    //   (blank line)
    // TODO 5: send JSON.stringify(message) to every WebSocket client whose
    //   readyState is WebSocket.OPEN
    return message;
  }

  // Anyone can post over plain HTTP.
  app.post('/messages', (req, res) => {
    const text = req.body?.text;
    if (typeof text !== 'string' || !text) return res.status(400).json({ error: 'text is required' });
    res.status(201).json(broadcast(text));
  });

  // TODO 1: GET /events, the Server-Sent Events stream.
  //   - headers: Content-Type: text/event-stream, Cache-Control: no-cache,
  //     Connection: keep-alive. Then res.flushHeaders() so the client sees them now.
  //   - add `res` to sseClients
  //   - TODO 2: when the client goes away (req.on('close')), remove it again

  // TODO 4: a WebSocket server on the same HTTP server, at path /ws
  //   (new WebSocketServer({ server, path: '/ws' })). On 'connection':
  //   - send { "type": "welcome" }
  //   - on each 'message': parse the JSON { "text": "..." } and broadcast(text)
  //   - if the message isn't valid JSON with a string text, send the SENDER
  //     { "type": "error", "error": "..." } and keep the connection open

  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env.PORT ?? 3000;
  createServer().listen(port, () => console.log(`Chat on http://localhost:${port}`));
}
