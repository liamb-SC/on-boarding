#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset
printf 'node_modules/\n' | put .gitignore
# jsdom is only here for the validator.
put package.json <<'JSON'
{
  "name": "team-page",
  "version": "1.0.0",
  "private": true,
  "devDependencies": {
    "@tailwindcss/cli": "^4.0.0",
    "jsdom": "^26.0.0",
    "tailwindcss": "^4.0.0"
  }
}
JSON

put src/input.css <<'CSS'
/* Pull Tailwind in here. */
CSS

put avatar.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#c7d2fe"/><circle cx="32" cy="24" r="12" fill="#4f46e5"/><ellipse cx="32" cy="60" rx="22" ry="16" fill="#4f46e5"/></svg>
SVG

# Unstyled markup. Style it with classes only: no <style>, no style="".
put index.html <<'HTML'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>The team</title>
  <link rel="stylesheet" href="dist/output.css">
</head>
<body class="">
  <main id="team" class="">

    <article id="card" class="">
      <img id="avatar" class="" src="avatar.svg" alt="" width="64" height="64">
      <div>
        <h2 id="name" class="">Priya Shah</h2>
        <p id="role" class="">Platform engineer</p>
      </div>
      <button id="follow" class="">Follow</button>
    </article>

    <article class="">
      <img src="avatar.svg" alt="" width="64" height="64">
      <div>
        <h2>Tom Okafor</h2>
        <p>Frontend engineer</p>
      </div>
      <button>Follow</button>
    </article>

    <article class="">
      <img src="avatar.svg" alt="" width="64" height="64">
      <div>
        <h2>Mei Lin</h2>
        <p>Product designer</p>
      </div>
      <button>Follow</button>
    </article>

  </main>
</body>
</html>
HTML

npm_install_sandbox
sb_commit_all "Unstyled team page"
