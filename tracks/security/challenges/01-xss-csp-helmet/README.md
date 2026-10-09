# 01 · XSS, output escaping and a Content-Security-Policy

**Skills:** stored vs reflected XSS, HTML escaping (text and attributes),
`helmet`, Content-Security-Policy, moving inline scripts out of the page.

## Background
**Cross-site scripting (XSS)** happens when user input ends up in a page as
*markup* instead of *text*. If a guest's message is `<script>...</script>`
and you paste it straight into the HTML, every visitor runs their script with
your site's cookies and permissions.

- **Stored XSS:** the payload is saved (a comment, a name) and served to others.
- **Reflected XSS:** the payload comes from the request (`?q=...`) and is
  echoed straight back. Attackers send victims a crafted link.

Defence in two layers:
1. **Escape on output.** Turn `<` into `&lt;` and so on, so the browser shows
   the characters instead of parsing them. Escape quotes too, or input inside
   `value="..."` can close the attribute and start a new tag.
2. **Content-Security-Policy (CSP).** A response header telling the browser
   which scripts may run. `script-src 'self'` means "only script files from
   this origin": injected inline `<script>` and `onclick=` won't run even if
   an escaping bug slips through. The price is that *your own* inline scripts
   must move into files too.

[`helmet`](https://helmetjs.github.io/) is Express middleware that sets a sane
default CSP plus other security headers (`X-Content-Type-Options: nosniff`,
frame protection, and it removes `X-Powered-By`).

## Scenario
`app.js` is a guestbook that builds its HTML with template strings and pastes
names, messages and the search term in raw. It also has an inline `<script>`
and an `onclick=` attribute.

## Goal
1. Implement `escapeHtml` in `html.js` (`& < > " '`).
2. Use it on **every** piece of user input in `app.js`: the search box value,
   the "Results for" text, names and messages.
3. Add `helmet()` so responses carry a CSP with `script-src 'self'` (no
   `'unsafe-inline'`), `object-src 'none'`, `nosniff` and frame protection,
   and no `X-Powered-By`.
4. Delete the inline `<script>` and `onclick`. Load `/app.js` with
   `<script src="/app.js"></script>` and have `public/app.js` attach the Clear
   button's behaviour with `addEventListener('click', ...)`.

## Try it
```bash
npm start
# sign the book with:  <img src=x onerror=alert(1)>
# or open:  http://localhost:3000/?q="><svg onload=alert(1)>
curl -sI localhost:3000 | grep -i -e content-security -e x-powered
```

## Hints
- Replace `&` **first**, otherwise you'd turn `&lt;` into `&amp;lt;`.
- `helmet()` with no options already has a good CSP. Read its header with
  `curl -sI` to see what it allows.
- Escaping is context-specific. This function is right for HTML text and
  quoted attributes, but not for URLs (`href="javascript:..."`), CSS or inside
  a `<script>`. Real apps use a templating engine that escapes by default
  (React, EJS `<%= %>`, Handlebars `{{ }}`).

## Check your work
```
./onboard validate security/01
```
