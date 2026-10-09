// Helpers shared by the AI tooling track's check.mjs validators: talk to an
// MCP server over stdio with the official SDK client from the sandbox.
import { expect, fromSandbox, SANDBOX } from '../../lib/checks.mjs';

const { Client } = await fromSandbox('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = await fromSandbox('@modelcontextprotocol/sdk/client/stdio.js');

// connect({ command, args, env, cwd }) — spawn the server and run the MCP
// handshake. Returns the connected client plus the server's stderr so far
// (handy for error messages) and any protocol errors seen. Close it with client.close().
export async function connect({ command, args = [], env = {}, cwd = SANDBOX }) {
  const transport = new StdioClientTransport({
    command, args, cwd, stderr: 'pipe',
    env: { PATH: process.env.PATH, HOME: process.env.HOME ?? '', ...env },
  });
  let stderr = '';
  transport.stderr?.on('data', (d) => { stderr += d; });
  const client = new Client({ name: 'onboard-validator', version: '1.0.0' });
  // Anything on stdout that isn't a JSON-RPC message surfaces here.
  const protocolErrors = [];
  client.onerror = (e) => protocolErrors.push(e?.message ?? String(e));
  try {
    await client.connect(transport);
  } catch (e) {
    throw new Error(`could not connect: ${e.message}${stderr ? ` | stderr: ${stderr}` : ''}`);
  }
  return { client, stderr: () => stderr, protocolErrors };
}

// The text of a tool result (all text content blocks joined).
export const textOf = (result) => (result?.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');

// Parse a tool result's text as JSON, with a readable error.
export function jsonOf(result) {
  const t = textOf(result);
  try { return JSON.parse(t); } catch { throw new Error(`expected JSON text, got: ${t.slice(0, 120)}`); }
}

export function toolNamed(tools, name) {
  const t = tools.find((x) => x.name === name);
  expect(t, `no tool named "${name}" (found: ${tools.map((x) => x.name).join(', ') || 'none'})`);
  return t;
}
