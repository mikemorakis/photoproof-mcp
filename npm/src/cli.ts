#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, basename, resolve } from "node:path";
import { PhotoproofClient, PhotoproofApiError, type PageSection, type PlanId, type PlanKind, type HealthCheckName } from "./index.js";
import { mcpConfigs, SERVER_NAME, SERVER_URL, type McpClientName } from "./config.js";

const VERSION = "0.1.0";
const CLIENTS: McpClientName[] = ["cursor", "claude-desktop", "vscode", "claude-code"];
const ALIASES: Record<string, McpClientName> = { cursor: "cursor", claude: "claude-desktop", "claude-desktop": "claude-desktop", vscode: "vscode", code: "vscode", "claude-code": "claude-code" };

const HELP = `photoproof ${VERSION}: set up the photoproof.io MCP connector and query the public API.

Usage
  photoproof setup [client] [--write] [--json]   MCP config for your AI app (default: all apps)
      clients: cursor, claude (Claude Desktop), vscode, claude-code
      --write  add photoproof to that app's config file (keeps your other servers, saves a .bak)
  photoproof plans [--id <id>] [--kind plan|one_off]   plans and prices (EUR, VAT incl.)
  photoproof pages [--section <section>]               public pages
  photoproof search <words> [--limit N]                search guides and pages
  photoproof health [--check d1|r2|watermark]          service status

Options
  --json         raw JSON output
  --base-url U   API base URL (default https://photoproof.io)
  -h, --help     this help    -v, --version   version

'npx photoproof-mcp' is the same as 'photoproof setup'.
Docs: https://photoproof.io/developers   MCP server: ${SERVER_URL}`;

interface Args { _: string[]; flags: Record<string, string | boolean> }
function parse(argv: string[]): Args {
  const out: Args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h") out.flags.help = true;
    else if (a === "-v") out.flags.version = true;
    else if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=", 2);
      if (v !== undefined) out.flags[k] = v;
      else if (["write", "json", "help", "version"].includes(k)) out.flags[k] = true;
      else if (i + 1 < argv.length) out.flags[k] = argv[++i];
      else out.flags[k] = true;
    } else out._.push(a);
  }
  return out;
}

const str = (v: string | boolean | undefined) => (typeof v === "string" ? v : undefined);
const print = (s = "") => process.stdout.write(s + "\n");

function writeConfig(file: string, key: string, entry: Record<string, unknown>): string {
  const path = resolve(file);
  let data: Record<string, unknown> = {};
  if (existsSync(path)) {
    const raw = readFileSync(path, "utf8");
    if (raw.trim()) {
      try { data = JSON.parse(raw); } catch { throw new Error(`${path} is not valid JSON. Fix it or add the entry by hand.`); }
    }
    copyFileSync(path, path + ".bak");
  } else mkdirSync(dirname(path), { recursive: true });
  const servers = (data[key] && typeof data[key] === "object" ? data[key] : {}) as Record<string, unknown>;
  servers[SERVER_NAME] = entry;
  data[key] = servers;
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
  return path;
}

function setup(args: Args): number {
  const which = args._[0];
  if (which && !ALIASES[which]) { console.error(`Unknown client "${which}". Use one of: cursor, claude, vscode, claude-code.`); return 2; }
  const all = mcpConfigs(SERVER_URL);
  const list = which ? [ALIASES[which]] : CLIENTS;
  if (args.flags.write && !which) { console.error("--write needs a client, e.g. photoproof setup cursor --write"); return 2; }
  if (args.flags.json) {
    print(JSON.stringify(Object.fromEntries(list.map((n) => {
      const c = all[n];
      return [n, c.key && c.entry ? { file: c.file, config: { [c.key]: { [SERVER_NAME]: c.entry } } } : { command: c.command }];
    })), null, 2));
    return 0;
  }
  for (const n of list) {
    const c = all[n];
    print(`\n== ${c.label}`);
    if (c.key && c.entry) {
      if (args.flags.write) {
        const path = writeConfig(c.file!, c.key, c.entry);
        print(`Added "${SERVER_NAME}" to ${path}${existsSync(path + ".bak") ? ` (previous version saved as ${basename(path)}.bak)` : ""}.`);
      } else {
        print(`File: ${c.file}`);
        print(JSON.stringify({ [c.key]: { [SERVER_NAME]: c.entry } }, null, 2));
      }
    }
    if (c.command) print(c.command);
    for (const note of c.notes) print(`- ${note}`);
  }
  if (!args.flags.write && list.some((n) => all[n].entry)) print(`\nTo write it for you: photoproof setup <client> --write`);
  print(`Connector help: https://photoproof.io/mcp`);
  return 0;
}

async function api(cmd: string, args: Args): Promise<number> {
  const client = new PhotoproofClient({ baseUrl: str(args.flags["base-url"]), headers: { "user-agent": `photoproof-cli/${VERSION}` } });
  const json = !!args.flags.json;
  if (cmd === "plans") {
    const r = await client.getPlans({ id: str(args.flags.id) as PlanId | undefined, kind: str(args.flags.kind) as PlanKind | undefined });
    if (json) return print(JSON.stringify(r, null, 2)), 0;
    for (const p of r.plans) {
      const prices = p.prices.map((x) => (x.amount === 0 ? "free" : `€${x.amount}${x.interval ? "/" + x.interval : ""}`)).join(" or ");
      print(`${p.name.padEnd(13)} ${prices.padEnd(22)} ${p.summary}`);
    }
    print(`\nPrices in ${r.currency}, VAT ${r.vat_included ? "included" : "excluded"}. ${r.pricing_url}`);
  } else if (cmd === "pages") {
    const r = await client.listPages({ section: str(args.flags.section) as PageSection | undefined });
    if (json) return print(JSON.stringify(r, null, 2)), 0;
    for (const p of r.pages) print(`${(p.section ?? "").padEnd(13)} ${p.title}\n${"".padEnd(14)}${p.url}`);
  } else if (cmd === "search") {
    const q = args._.join(" ").trim();
    if (!q) { console.error("Usage: photoproof search <words>"); return 2; }
    const limit = str(args.flags.limit) ? Number(args.flags.limit) : undefined;
    const r = await client.search(q, { limit });
    if (json) return print(JSON.stringify(r, null, 2)), 0;
    if (!r.results.length) print(`No results for "${q}".`);
    for (const x of r.results) print(`${x.title}\n  ${x.url}${x.snippet ? `\n  ${x.snippet}` : ""}`);
  } else if (cmd === "health") {
    const r = await client.getHealth({ check: str(args.flags.check) as HealthCheckName | undefined });
    if (json) return print(JSON.stringify(r, null, 2)), r.ok ? 0 : 1;
    print(`photoproof.io is ${r.ok ? "up" : "having problems"} (checked ${r.checked_at})`);
    for (const [k, v] of Object.entries(r.checks)) print(`  ${k.padEnd(10)} ${v?.ok ? "ok" : "FAIL"}  ${v?.latency_ms ?? "?"} ms`);
    return r.ok ? 0 : 1;
  }
  return 0;
}

async function main(): Promise<number> {
  const args = parse(process.argv.slice(2));
  const invokedAs = basename(process.argv[1] ?? "");
  if (args.flags.version) return print(VERSION), 0;
  if (args.flags.help) return print(HELP), 0;
  let cmd = args._.shift();
  if (invokedAs.startsWith("photoproof-mcp") && (!cmd || ALIASES[cmd])) { if (cmd) args._.unshift(cmd); cmd = "setup"; }
  if (!cmd || cmd === "help") return print(HELP), 0;
  if (cmd === "setup") return setup(args);
  if (["plans", "pages", "search", "health"].includes(cmd)) return api(cmd, args);
  console.error(`Unknown command "${cmd}".\n\n${HELP}`);
  return 2;
}

main().then((code) => { process.exitCode = code; }, (e: unknown) => {
  if (e instanceof PhotoproofApiError) console.error(`Error ${e.status} (${e.code}): ${e.message}`);
  else console.error(e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
});
