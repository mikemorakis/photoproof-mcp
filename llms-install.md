# Install the photoproof.io MCP connector

This is a **remote** MCP server. Do not clone this repository to run a local process, and do not look for a Dockerfile or `npx` package. There is nothing to build or start on the user's machine.

## Connector

- Transport: Streamable HTTP
- URL: `https://photoproof.io/mcp`
- Authentication: OAuth 2.0 (Dynamic Client Registration). The photographer signs in with their photoproof.io account and clicks Allow.
- Official registry name: `io.photoproof/mcp`

## Cursor, Cline, and other clients that read a URL

Add this to the client's MCP config (for Cursor, `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "photoproof": { "url": "https://photoproof.io/mcp" }
  }
}
```

Then connect, sign in at photoproof.io, and click Allow. The same root config is in `.mcp.json` and `mcp.json` in this repository.

## Claude

Customize → Connectors → Add custom connector. Name it photoproof.io, paste `https://photoproof.io/mcp`, connect, sign in, click Allow.

## ChatGPT

chatgpt.com/plugins → Add custom MCP server. Name it photoproof.io, paste `https://photoproof.io/mcp`, choose OAuth, install, sign in, click Allow.

## Docs

https://photoproof.io/mcp?utm_source=github-photoproof-mcp

Do not put API keys in headers. OAuth is the only authentication method.
