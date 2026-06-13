# API Reference

Dua bagian: (A) endpoint **aplikasi** dan (B) endpoint **Repliz** yang dipakai aplikasi.

---

## A. Endpoint Aplikasi

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/api/health` | — | Health check |
| `GET/POST` | `/api/webhooks/repliz` | secret/HMAC | Penerima webhook Repliz ([WEBHOOK.md](WEBHOOK.md)) |
| `GET/POST/DELETE` | `/api/mcp` | Bearer `MCP_AUTH_TOKEN` | MCP server (Streamable HTTP) ([MCP.md](MCP.md)) |

Mutasi data dari UI memakai **Server Actions** (bukan REST), mis. `syncAccounts()` di [`app/(app)/akun/actions.ts`](../app/(app)/akun/actions.ts). Pembacaan memakai Supabase client (RLS) langsung di Server Components.

### RPC Supabase (dipanggil dari app)

| Fungsi | Keterangan |
|---|---|
| `ensure_default_membership()` | Auto-join workspace bersama (dipanggil di layout) |
| `dashboard_metrics(p_workspace_id)` | Metrik untuk Dashboard |
| `match_knowledge_chunks(persona_id, embedding, k)` | Pencarian RAG (pgvector) |
| `create_workspace(p_name)` | Buat workspace + jadikan pemanggil admin |

---

## B. Repliz API (typed client)

Client: [`lib/repliz/client.ts`](../lib/repliz/client.ts). Auth **HTTP Basic** (`REPLIZ_USERNAME`/`PASSWORD`). Base `https://api.repliz.com`. Spec resmi: `https://api.repliz.com/public-json`.

| Operasi | Repliz | Method `ReplizClient` |
|---|---|---|
| List akun | `GET /public/account?page&limit&type` | `listAccounts()` |
| OAuth Threads (mulai) | `GET /public/account/threads/authorize?redirect=` | `getThreadsAuthorizeUrl()` |
| OAuth Threads (selesai) | `POST /public/account/threads/connect {code}` | `connectThreads()` |
| Jadwalkan konten | `POST /public/schedule` | `createSchedule()` |
| Hapus jadwal | `DELETE /public/schedule/{id}` | `deleteSchedule()` |
| Retry jadwal | `PUT /public/schedule/{id}/retry` | `retrySchedule()` |
| Balas komentar | `POST /public/comment/{id} {text}` | `replyComment()` |
| Update status komentar | `PUT /public/comment/{id}/status` | `updateCommentStatus()` |
| Statistik konten | `GET /public/content/{id}/statistic?accountId` | `getContentStatistic()` |

### Body `POST /public/schedule`

```jsonc
{
  "title": "string",
  "description": "isi post utama",
  "topic": "lifestyle",
  "type": "text",                  // text|image|video|reel|album|link|story
  "medias": [],
  "accountId": "69fbf...",
  "scheduleAt": "2026-05-21T01:00:00Z",   // ISO UTC (konversi WIB->UTC di lib/repliz/time.ts)
  "replies": [                     // hanya untuk thread (Nested)
    { "description": "balasan 1", "type": "text", "medias": [] }
  ]
}
```

---

## Queue & Worker

- **Penjadwalan**: `pg_cron` (tiap menit) → `enqueue_due_schedules()` → tabel `ai_jobs` + queue `pgmq` `ai_jobs`.
- **Worker** (fase berikutnya, Supabase Edge Function): baca `pgmq`, eksekusi job (`schedule_push`, `comment_reply`, `idea_research`, `embedding`), update `ai_jobs`, tulis hasil, log error ke `error_logs`.
- Job types: lihat enum `job_type_t`.

## Model Data (ringkas)

`workspaces` → `workspace_members` (role) ; `accounts` → `personas` → `knowledge_bases` → `knowledge_chunks` ; `content_ideas` → `contents` → `content_segments` & `schedules` ; `comments` ; observabilitas: `ai_jobs`, `webhook_events`, `error_logs`. Semua tabel ber-RLS per `workspace_id`. Tipe TypeScript: [`lib/database.types.ts`](../lib/database.types.ts).
