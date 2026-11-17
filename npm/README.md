# photoproof

Official CLI and typed JavaScript client for [photoproof.io](https://photoproof.io), online photo proofing for photographers.

- **CLI:** sets up the photoproof.io MCP server (`https://photoproof.io/mcp`) in Claude Desktop, Cursor, VS Code or Claude Code, so you can ask your AI which photos a client picked, get Lightroom file names, or create a gallery.
- **Client:** typed access to the public read-only API (plans and prices, public pages, site search, service health). No API key.

Docs: https://photoproof.io/developers

## Set up the MCP connector

```sh
npx photoproof setup              # print the config for every supported app
npx photoproof setup cursor --write   # add photoproof to ~/.cursor/mcp.json
npx photoproof setup claude --write   # add it to Claude Desktop's config (via mcp-remote)
npx photoproof setup vscode --write   # add it to .vscode/mcp.json in this folder
npx photoproof setup claude-code      # print the `claude mcp add` command
```

`npx photoproof-mcp` does the same as `photoproof setup`.

`--write` keeps your other MCP servers and saves the previous file as `.bak`. Then open the app, connect photoproof, sign in to photoproof.io and click **Allow**. The connector uses OAuth; there are no API keys. In Claude (web, desktop and mobile) you can also skip the file: Customize → Connectors → Add custom connector → `https://photoproof.io/mcp`.

## Query the public API from the terminal

```sh
npx photoproof plans                 # plans and prices (EUR, VAT included)
npx photoproof plans --id pro
npx photoproof pages --section guides
npx photoproof search "lightroom selection" --limit 3
npx photoproof health
```

Add `--json` for raw JSON.

## Use the client in code

```ts
import { PhotoproofClient } from "photoproof";

const pp = new PhotoproofClient();
const { plans } = await pp.getPlans({ kind: "plan" });
const { results } = await pp.search("client selection", { limit: 5 });
const health = await pp.getHealth();
```

Works in Node 18+ and in browsers (CORS is open). Errors throw `PhotoproofApiError` with `status`, `code` and `message`.

| Method | Endpoint |
| --- | --- |
| `getPlans({ id?, kind? })` | `GET /api/v1/plans` |
| `listPages({ section? })` | `GET /api/v1/pages` |
| `search(q, { limit? })` | `GET /api/v1/search` |
| `getHealth({ check? })` | `GET /api/health` |

OpenAPI 3.1 spec: https://photoproof.io/openapi.json

## What the MCP server can do

Read your account, galleries, client selections and comments, recent activity and delivery links, and create new empty galleries (with the `galleries:write` scope). It can't delete anything, upload photos, pay or email clients. Details: https://photoproof.io/mcp

## License

MIT
