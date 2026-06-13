# MCP — Generate konten & komentar lewat Claude / Codex

ThreadsGrowth memakai **MCP** sebagai mesin generate utama: kamu menyambungkan **Claude Desktop** atau **Claude Code** ke app, lalu Claude yang membuat ide, konten (single / nested), jadwal, dan balasan komentar — langsung tersimpan di app.

- **Endpoint**: `https://<domain>/api/mcp` (lokal: `http://localhost:3000/api/mcp`)
- **Auth**: header `Authorization: Bearer <MCP_AUTH_TOKEN>`
- Set env `MCP_AUTH_TOKEN` dulu (di `.env.local`, atau di Vercel/Dokploy saat deploy).

---

## 1. Untuk pengguna non-teknis (ringkas)

1. Minta developer/admin mengaktifkan MCP: isi `MCP_AUTH_TOKEN` di pengaturan hosting.
2. Buka menu **Pengaturan → Integrasi AI (MCP)** di app, klik **Salin** perintahnya.
3. Tempel perintah itu di terminal **Claude Code**, atau ke config **Claude Desktop** (langkah di bawah).
4. Di Claude, cukup ketik dalam bahasa biasa, contoh:
   > "Pakai threadsgrowth: ambil persona akun @nadira, buat 5 ide, jadikan 2 konten nested + 3 single, lalu jadwalkan 3 post per hari mulai jam 8 pagi."

Claude akan mengerjakannya. Hasilnya muncul di menu **Konten** & **Kalender**.

---

## 2. Tools yang tersedia

**Baca / konteks:** `get_stats`, `list_accounts`, `get_persona`, `list_recent_titles`, `get_automation_settings`, `list_content_ideas`, `list_pending_comments`.

**Tulis / generate:**
| Tool | Fungsi |
|---|---|
| `create_idea` | Simpan ide konten |
| `create_content` | Simpan konten **single** atau **thread (nested)** + skor viral + komentar pemicu |
| `schedule_content` | Jadwalkan konten (waktu ISO UTC) → worker posting ke Repliz |
| `submit_comment_reply` | Balas komentar masuk (kirim ke Repliz + tandai dibalas) |

---

## 3. Sambungkan **Claude Code**

```bash
claude mcp add threadsgrowth --transport http \
  https://<domain>/api/mcp \
  --header "Authorization: Bearer <MCP_AUTH_TOKEN>"

# lokal:
claude mcp add threadsgrowth --transport http \
  http://localhost:3000/api/mcp \
  --header "Authorization: Bearer <MCP_AUTH_TOKEN>"
```
Cek: `claude mcp list`.

## 4. Sambungkan **Claude Desktop**

Edit `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/`, Windows: `%APPDATA%\Claude\`):

```jsonc
{
  "mcpServers": {
    "threadsgrowth": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://<domain>/api/mcp",
        "--header", "Authorization: Bearer <MCP_AUTH_TOKEN>"]
    }
  }
}
```
Simpan → **restart Claude Desktop**. Server `threadsgrowth` muncul di menu tools.

---

## 5. Akses MCP saat sudah deploy

MCP berada di domain yang sama dengan app — tidak perlu server terpisah.

- **Vercel**: set `MCP_AUTH_TOKEN` di Project → Settings → Environment Variables, redeploy. URL: `https://<app>.vercel.app/api/mcp`.
- **Dokploy**: set `MCP_AUTH_TOKEN` di Environment aplikasi, redeploy. URL: `https://<domain-kamu>/api/mcp`.

Lalu pakai perintah `claude mcp add ...` di atas dengan URL deploy-mu.

---

## 6. Uji manual
```bash
# tanpa token -> 401
curl -i https://<domain>/api/mcp
# daftar tools
curl -s https://<domain>/api/mcp -H "Authorization: Bearer <MCP_AUTH_TOKEN>" \
  -H "content-type: application/json" -H "accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Keamanan
Perlakukan `MCP_AUTH_TOKEN` seperti password; rotasi berkala. Server beroperasi pada satu workspace internal. Generate manual (tanpa MCP) tetap tersedia di menu **Riset Ide**.
