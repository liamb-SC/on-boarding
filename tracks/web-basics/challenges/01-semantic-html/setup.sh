#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset
printf 'node_modules/\n' | put .gitignore
# jsdom is only here for the validator, which parses your HTML with it.
put package.json <<'JSON'
{
  "name": "crumb-and-co",
  "version": "1.0.0",
  "private": true,
  "devDependencies": {
    "jsdom": "^26.0.0"
  }
}
JSON

# "Div soup": it looks fine in a browser, but to a screen reader, a search
# engine or a keyboard user it's one undifferentiated blob.
put index.html <<'HTML'
<html>
<head>
  <title>Crumb & Co. Bakery</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="header">
    <div class="logo">Crumb & Co.</div>
    <div class="nav">
      <a href="/">Home</a>
      <a href="/menu">Menu</a>
      <a href="/contact">Contact</a>
    </div>
  </div>

  <div class="content">
    <div class="title">Fresh bread, every morning</div>
    <img src="loaf.svg" width="320" height="200">

    <div class="post">
      <div class="post-title">Sourdough is back</div>
      <p>Our 48-hour sourdough returns on Saturday. Get there early.</p>
    </div>

    <div class="subtitle">Order ahead</div>
    <div class="order">
      Name <input type="text" id="name">
      Email <input type="text" id="email">
      Loaves <input type="text" id="loaves">
      <div class="button" onclick="placeOrder()">Order</div>
    </div>
  </div>

  <div class="footer">© Crumb & Co.</div>
</body>
</html>
HTML
put styles.css <<'CSS'
body { font: 16px/1.5 system-ui, sans-serif; max-width: 40rem; margin: 0 auto; padding: 1rem; }
.title, h1 { font-size: 2rem; font-weight: bold; }
.subtitle, .post-title, h2 { font-size: 1.4rem; font-weight: bold; }
.button, button { display: inline-block; padding: .4rem 1rem; background: #7a4b1e; color: #fff; border: 0; cursor: pointer; }
CSS
put loaf.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="#e8c58f"/><ellipse cx="160" cy="110" rx="120" ry="60" fill="#b5772f"/></svg>
SVG

npm_install_sandbox
sb_commit_all "Crumb & Co. homepage (div soup)"
