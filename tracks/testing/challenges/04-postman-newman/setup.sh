#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset
cp "$REPO_ROOT/tracks/testing/fixtures/notes-api.mjs" "$SANDBOX_DIR/"
printf 'node_modules/\n' | put .gitignore
put package.json <<'JSON'
{
  "name": "notes-api-tests",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node notes-api.mjs",
    "test": "newman run collection.json --env-var baseUrl=http://localhost:5055"
  },
  "devDependencies": {
    "newman": "^6.2.0"
  }
}
JSON

# A Postman collection (format v2.1) with one request and its test script.
put collection.json <<'JSON'
{
  "info": {
    "name": "Notes API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:5055" }
  ],
  "item": [
    {
      "name": "Health",
      "request": { "method": "GET", "url": "{{baseUrl}}/health" },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('status is 200', () => pm.response.to.have.status(200));",
              "pm.test('says ok', () => pm.expect(pm.response.json().status).to.eql('ok'));"
            ]
          }
        }
      ]
    }
  ]
}
JSON

npm_install_sandbox
sb_commit_all "Notes API and a one-request Postman collection"
