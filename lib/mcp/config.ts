// Generates ready-to-paste MCP client configs for the ThreadsGrowth MCP server.
// Shared by Pengaturan (real token) and Panduan (placeholder token).

export const MCP_CLIENTS = ["Claude Desktop", "Claude Code", "Cursor", "OpenCode"] as const;
export type McpClient = (typeof MCP_CLIENTS)[number];

export type McpConfig = { file: string; text: string; note: string };

export function mcpConfigFor(client: McpClient, mcpUrl: string, token: string): McpConfig {
  switch (client) {
    case "Claude Code":
      return {
        file: "Terminal",
        text: `claude mcp add threadsgrowth --transport http ${mcpUrl} --header "Authorization: Bearer ${token}"`,
        note: "Jalankan di terminal, lalu cek dengan: claude mcp list",
      };
    case "Cursor":
      return {
        file: ".cursor/mcp.json",
        text: `{
  "mcpServers": {
    "threadsgrowth": {
      "url": "${mcpUrl}",
      "headers": { "Authorization": "Bearer ${token}" }
    }
  }
}`,
        note: "Simpan di .cursor/mcp.json (folder proyek) atau ~/.cursor/mcp.json (global), lalu aktifkan di Settings → MCP.",
      };
    case "OpenCode":
      return {
        file: "opencode.json",
        text: `{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "threadsgrowth": {
      "type": "remote",
      "url": "${mcpUrl}",
      "enabled": true,
      "headers": { "Authorization": "Bearer ${token}" }
    }
  }
}`,
        note: "Tambahkan ke opencode.json (folder proyek atau ~/.config/opencode/), lalu jalankan ulang OpenCode.",
      };
    case "Claude Desktop":
    default:
      return {
        file: "claude_desktop_config.json",
        text: `{
  "mcpServers": {
    "threadsgrowth": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote", "${mcpUrl}",
        "--header", "Authorization: Bearer ${token}"
      ]
    }
  }
}`,
        note: "Settings → Developer → Edit Config. Tempel, simpan, lalu buka ulang Claude Desktop.",
      };
  }
}
