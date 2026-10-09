# 05 · WebSockets and Server-Sent Events

**Skills:** `text/event-stream` and the SSE wire format, the `ws` library,
broadcasting to connected clients, cleaning up on disconnect.

## Background
Plain HTTP is request/response, so the server can't speak first. There are two
common ways to push updates:

| | Server-Sent Events (SSE) | WebSockets |
|-|-------------------------|-----------|
| Direction | server → client only | both ways |
| Protocol | an ordinary HTTP response that never ends | HTTP `Upgrade` to its own framed protocol |
| Browser API | `new EventSource('/events')` with auto-reconnect | `new WebSocket('ws://…')` |
| Good for | feeds, notifications, progress, LLM token streams | chat, games, collaborative editing |

An SSE stream is just text. Each event is a few `field: value` lines followed
by a **blank line**:

```
id: 7
event: message
data: {"type":"message","id":7,"text":"hello"}

```

Both kinds of connection stay open, so the server has to keep track of who's
connected **and forget them when they leave**. Otherwise you leak memory and
write to dead sockets.

## Scenario
`server.js` is a tiny chat server. `POST /messages` exists and calls
`broadcast()`, but `broadcast()` doesn't send anything, and there's no
`/events` endpoint and no WebSocket server yet. `public/index.html` is a demo
page that uses both.

## Goal
Follow the `TODO`s in `server.js`:
1. `GET /events` streams SSE (correct headers) and tracks the client.
2. Remove the client when its connection closes.
3. `broadcast()` writes each message to SSE clients as `id` / `event: message`
   / `data` lines.
4. A WebSocket server at `/ws` sends `{"type":"welcome"}` on connect and
   broadcasts each `{ "text": … }` it receives.
5. `broadcast()` also sends to every open WebSocket. Invalid input gets a
   `{"type":"error"}` reply instead of crashing the server.

## Try it
```bash
npm start                                    # then open http://localhost:3000 in two tabs
curl -N localhost:3000/events                # watch the raw SSE stream
curl localhost:3000/messages -H 'content-type: application/json' -d '{"text":"hi"}'
```

## Hints
- `res.writeHead(200, { ... })` or `res.set({...})` + `res.flushHeaders()`.
- `res.write(\`id: ${m.id}\nevent: message\ndata: ${JSON.stringify(m)}\n\n\`)`.
  The blank line ends the event.
- `wss.clients` is a `Set` of every connected socket.
- `ws.on('message', (data) => ...)` gives you a Buffer. Use `data.toString()`.

## Check your work
```
./onboard validate backend-apis/05
```
