import { homedir, platform } from "node:os";
import { join } from "node:path";

export const SERVER_NAME = "photoproof";
export const SERVER_URL = "https://photoproof.io/mcp";

export type McpClientName = "cursor" | "claude-desktop" | "vscode" | "claude-code";

export interface ClientConfig {
  name: McpClientName;
  label: string;
  /** File the config goes in (absolute or relative to the current folder). Absent for CLI-only setups. */
  file?: string;
  /** Top-level key in that file holding the servers. */
  key?: "mcpServers" | "servers";
  /** The server entry to add under `key`. */
  entry?: Record<string, unknown>;
  /** Command alternative (e.g. Claude Code). */
  command?: string;
  notes: string[];
}

export function claudeDesktopConfigPath(): string {
  const home = homedir();
  switch (platform()) {
    case "darwin": return join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json");
    case "win32": return join(process.env.APPDATA ?? join(home, "AppData", "Roaming"), "Claude", "claude_desktop_config.json");
    default: return join(home, ".config", "Claude", "claude_desktop_config.json");
  }
}

export function mcpConfigs(url: string = SERVER_URL): Record<McpClientName, ClientConfig> {
  return {
    cursor: {
      name: "cursor", label: "Cursor", file: join(homedir(), ".cursor", "mcp.json"), key: "mcpServers",
      entry: { url },
      notes: ["Open Cursor Settings → MCP, click Connect next to photoproof, sign in to photoproof.io and click Allow."],
    },
    "claude-desktop": {
      name: "claude-desktop", label: "Claude Desktop", file: claudeDesktopConfigPath(), key: "mcpServers",
      entry: { command: "npx", args: ["-y", "mcp-remote", url] },
      notes: [
        "Easiest: in Claude open Customize → Connectors → Add custom connector and paste " + url + " (no config file needed).",
        "The config file route uses the open-source mcp-remote bridge (needs Node.js). Restart Claude Desktop after writing it; a browser window opens for photoproof.io sign-in.",
      ],
    },
    vscode: {
      name: "vscode", label: "VS Code (this folder)", file: join(".vscode", "mcp.json"), key: "servers",
      entry: { type: "http", url },
      notes: ["Open the folder in VS Code, then start the photoproof server from .vscode/mcp.json and sign in when asked."],
    },
    "claude-code": {
      name: "claude-code", label: "Claude Code",
      command: `claude mcp add --transport http ${SERVER_NAME} ${url}`,
      notes: ["Run the command, then /mcp inside Claude Code to sign in."],
    },
  };
}
