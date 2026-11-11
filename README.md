# photoproof.io MCP connector

Ask an AI about your photo galleries and client picks, or create a new gallery.

This repository holds the public docs and manifests for the [photoproof.io](https://photoproof.io?utm_source=github-photoproof-mcp) remote MCP connector. The connector itself is hosted at `https://photoproof.io/mcp`. There is no local server to install, and this repo does not contain application source code.

**Official MCP Registry name:** `io.photoproof/mcp`  
**Transport:** Streamable HTTP  
**Authentication:** OAuth 2.0 (the photographer signs in with their photoproof.io account)  
**Plans:** every plan, Free included

Setup guide: [photoproof.io/mcp](https://photoproof.io/mcp?utm_source=github-photoproof-mcp)

## What it does

[photoproof.io](https://photoproof.io?utm_source=github-photoproof-mcp) is online photo proofing for photographers: you send a client a gallery link, they select, reject or comment on photos and confirm their picks, then you deliver the finals.

Connect Claude, ChatGPT, Cursor or another MCP client to your account, then ask in plain words about your galleries and client selections, get Lightroom file names, or create a new empty gallery. The assistant only sees your own account. Clients are shown as “Client 1, Client 2”, as in the dashboard.

It cannot delete anything, upload photos, change your plan, take payment, or email your clients. Disconnect an app from **Connected AI apps** in the dashboard.

## Tools

Read-only unless noted:

| Tool | Title | What it does |
| --- | --- | --- |
| `get_account` | Account | Plan, storage used and limit, renewal date and gallery counts |
| `list_galleries` | List galleries | Your galleries, newest first: title, client link, photo count, expiry, settings, and how many clients opened or confirmed |
| `search_galleries` | Search galleries | Find galleries whose title contains the given text |
| `get_gallery` | Gallery details | One gallery: settings (watermark, password on/off, download lock), expiry, size, client visits and delivery-link count |
| `get_selections` | Client selections | What each client picked (photo codes = file names without extension, ready for a Lightroom filename filter), rejects, comments, and whether they confirmed |
| `recent_activity` | Recent activity | Galleries clients opened and selections they confirmed in the last N days |
| `list_deliveries` | Delivery links | Final-photo delivery links: title, link, files, tracked downloads (Pro/Studio) and expiry |
| `create_gallery` | Create gallery | Create a new, empty proofing gallery (watermark on by default). Returns the client link and the dashboard link where you upload photos. You can deny this scope when connecting. |

## How to connect

The endpoint to paste is always `https://photoproof.io/mcp` (no UTM on this URL).

### Claude (claude.ai, desktop and mobile)

1. Open **Customize → Connectors**, click **+ Add**, then **Add custom connector**.
2. Name it **photoproof.io** and paste `https://photoproof.io/mcp`. Keep the settings Claude detects.
3. Click **Add**, then **Connect**. Sign in to photoproof.io and click **Allow**.
4. In a chat, open **+ → Connectors** and make sure photoproof.io is switched on.

### ChatGPT (on the web)

1. Go to [chatgpt.com/plugins](https://chatgpt.com/plugins), click **+**, then **Add custom MCP server**.
2. Name it **photoproof.io**, paste `https://photoproof.io/mcp` as the server URL and choose **OAuth**.
3. Create it as a plugin, install it, sign in to photoproof.io and click **Allow**.
4. In a new chat, type `@` and pick photoproof.io.

### Cursor

Open **Cursor Settings → MCP** and add a new server, or add this to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "photoproof": { "url": "https://photoproof.io/mcp" }
  }
}
```

Click **Connect**, sign in to photoproof.io and click **Allow**. The same config is in [`.mcp.json`](.mcp.json) at the root of this repository (for directory auto-detect).

### Other MCP clients

Any client that supports remote Streamable HTTP and OAuth can use `https://photoproof.io/mcp`. See [llms-install.md](llms-install.md) for a short agent-oriented install note.

## Example questions

- “Which photos did Maria pick in the wedding gallery? Give me the file names for Lightroom.”
- “Which galleries did clients open this week, and who has confirmed?”
- “Any client comments I haven’t answered in the Nikos & Eleni gallery?”
- “Create a gallery called Anna christening that expires in 60 days.”
- “How much storage do I have left?”

## Limits

- 120 requests an hour per photographer
- 20 new galleries a day through AI apps
- A connection stays signed in for up to 60 days
- Your photoproof.io plan limits still apply (storage, gallery expiry)

## Privacy and support

- Privacy policy: [photoproof.io/privacy](https://photoproof.io/privacy?utm_source=github-photoproof-mcp)
- Terms: [photoproof.io/terms](https://photoproof.io/terms?utm_source=github-photoproof-mcp)
- Setup and disconnect: [photoproof.io/mcp](https://photoproof.io/mcp?utm_source=github-photoproof-mcp)
- Support: [support@photoproof.io](mailto:support@photoproof.io)
- Security reports: [support@photoproof.io](mailto:support@photoproof.io)

Official registry entry: [io.photoproof/mcp](https://registry.modelcontextprotocol.io/v0.1/servers?search=io.photoproof/mcp)

## Publisher

Published by **SYMBOLS HOUSE OF BRANDS O.E.**, Iphigeneias 6, Kallithea 17672, Greece.  
Built by [xolqy.com](https://xolqy.com).

The documentation and manifests in this repository are released under the [MIT License](LICENSE).
