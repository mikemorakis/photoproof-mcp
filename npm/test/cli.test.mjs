import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cli = new URL("../dist/cli.js", import.meta.url).pathname;
const run = (args, env = {}) => execFileSync(process.execPath, [cli, ...args], { encoding: "utf8", env: { ...process.env, ...env } });

test("help and version", () => {
  assert.match(run(["--help"]), /photoproof setup/);
  assert.equal(run(["-v"]).trim(), "0.1.0");
});

test("setup --json prints configs for all clients", () => {
  const out = JSON.parse(run(["setup", "--json"]));
  assert.deepEqual(out.cursor.config, { mcpServers: { photoproof: { url: "https://photoproof.io/mcp" } } });
  assert.equal(out.vscode.config.servers.photoproof.type, "http");
  assert.match(out["claude-code"].command, /claude mcp add --transport http photoproof https:\/\/photoproof.io\/mcp/);
});

test("setup cursor --write merges into an existing config and keeps a backup", () => {
  const home = mkdtempSync(join(tmpdir(), "pp-"));
  mkdirSync(join(home, ".cursor"));
  const file = join(home, ".cursor", "mcp.json");
  writeFileSync(file, JSON.stringify({ mcpServers: { other: { url: "https://example.com/mcp" } } }));
  run(["setup", "cursor", "--write"], { HOME: home, USERPROFILE: home });
  const data = JSON.parse(readFileSync(file, "utf8"));
  assert.equal(data.mcpServers.other.url, "https://example.com/mcp");
  assert.equal(data.mcpServers.photoproof.url, "https://photoproof.io/mcp");
  assert.ok(existsSync(file + ".bak"));
});

test("client builds query strings and throws typed errors", async () => {
  const { PhotoproofClient, PhotoproofApiError } = await import("../dist/index.js");
  const seen = [];
  const fake = async (url) => { seen.push(String(url)); return new Response(JSON.stringify({ error: "bad_request", message: "nope" }), { status: 400 }); };
  const c = new PhotoproofClient({ fetch: fake });
  await assert.rejects(c.search("x y", { limit: 2 }), (e) => e instanceof PhotoproofApiError && e.status === 400 && e.code === "bad_request");
  assert.equal(seen[0], "https://photoproof.io/api/v1/search?q=x+y&limit=2");
});
