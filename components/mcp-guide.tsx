"use client";

import { useEffect, useState } from "react";
import { CopyBlock } from "@/components/copy-block";
import { MCP_CLIENTS, mcpConfigFor, type McpClient } from "@/lib/mcp/config";

/**
 * Interactive "connect your AI assistant" guide. Uses a placeholder token on the
 * public guide page (the real token lives in Pengaturan, admin-only).
 */
export function McpGuide({ appUrl, token = "TOKEN-DARI-PENGATURAN" }: { appUrl: string; token?: string }) {
  const [origin, setOrigin] = useState(appUrl || "");
  const [client, setClient] = useState<McpClient>("Claude Desktop");

  useEffect(() => {
    // Always prefer the live domain (fixes stale APP_URL like localhost).
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const base = (origin || "https://app-kamu.com").replace(/\/$/, "");
  const mcpUrl = `${base}/api/mcp`;
  const cfg = mcpConfigFor(client, mcpUrl, token);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {MCP_CLIENTS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setClient(c)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${
              client === c
                ? "border-primary bg-primary/5 font-medium text-primary ring-1 ring-primary"
                : "hover:bg-accent"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {cfg.file === "Terminal" ? "Jalankan perintah ini:" : `Tempel ke file ${cfg.file}:`}
      </p>
      <CopyBlock text={cfg.text} label="Salin" />
      <p className="text-xs text-muted-foreground">{cfg.note}</p>
      <p className="text-xs text-muted-foreground">
        Ganti <code className="rounded bg-muted px-1">{token}</code> dengan token aslimu dari halaman Pengaturan
        (bagian &ldquo;Kendalikan lewat AI&rdquo;). URL sudah otomatis: <code className="rounded bg-muted px-1">{mcpUrl}</code>.
      </p>
    </div>
  );
}
