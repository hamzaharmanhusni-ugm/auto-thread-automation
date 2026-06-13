# ThreadsGrowth AI

Platform untuk **mengelola & mengotomatiskan akun Threads** yang sudah ada: jadwalkan konten (single / nested), dan balas komentar otomatis — semua dari satu web app, ditenagai **MCP** (Claude / Codex) untuk generate konten & komentar.

Integrasi Threads lewat **Repliz** (auto-schedule + auto-comment). Generate ide/konten/balasan diutamakan lewat **MCP** (sambungkan Claude), dengan opsi generate manual bawaan.

---

## 🚀 Cara memulai (lokal)

```bash
# 1. Install
npm install

# 2. Konfigurasi env
cp .env.example .env.local
```

Isi `.env.local` minimal:

| Variabel | Untuk |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Database & auth (Supabase) |
| `USER_EMAIL_DEFAULT` | Email yang boleh **mendaftar admin pertama** |
| `MCP_AUTH_TOKEN` | Token untuk integrasi MCP (Claude/Codex) |
| `REPLIZ_USERNAME`, `REPLIZ_PASSWORD` | Default Repliz (bisa juga diisi dari UI) |

```bash
# 3. Siapkan database (sekali). Pilih salah satu:
#    a) Supabase CLI:
supabase link --project-ref <REF> && supabase db push
#    b) atau tempel isi supabase/migrations/*.sql ke SQL Editor

# 4. Jalankan
npm run dev    # http://localhost:3000
```

**Langkah pertama di app:**
1. Buka `/login` → karena belum ada admin, muncul **"Buat akun admin pertama"** (email terkunci ke `USER_EMAIL_DEFAULT`).
2. Masuk → buka **Pengaturan** → isi **kredensial Repliz** & **kunci AI** (atau pakai .env), atur **Otomasi** (post/hari, jumlah auto-comment, jam posting).
3. **Akun** → Sinkronkan akun Threads dari Repliz.
4. Generate konten: lewat **MCP** (sambungkan Claude, lihat di bawah) atau **manual** di menu Riset.
5. **Kalender** → tarik draf ke tanggal untuk menjadwalkan.

---

## 🤖 Generate via MCP (utama)

Sambungkan **Claude Desktop / Claude Code** ke MCP server app ini, lalu minta Claude:
*"Pakai threadsgrowth: ambil persona akun X, buat 3 ide, jadikan konten (single & nested), jadwalkan 3 post/hari."*

Claude akan memakai tools: `get_persona`, `list_recent_titles`, `get_automation_settings`, `create_idea`, `create_content`, `schedule_content`, `list_pending_comments`, `submit_comment_reply`. Panduan lengkap (termasuk saat sudah deploy): [docs/MCP.md](docs/MCP.md).

---

## 👥 Akses tim (seperti n8n self-hosted)

- User **pertama** = admin (email = `USER_EMAIL_DEFAULT`).
- Anggota lain via **tautan undangan** (Pengaturan → Undang Anggota) → buka `/invite/<token>`.
- **Lupa kata sandi**: tautan di halaman masuk → email reset.

---

## 🧱 Stack
Next.js 16 (App Router) · TypeScript · Tailwind v4 + shadcn/ui · Supabase (Postgres+pgvector, Auth, Storage, Edge Functions) · queue/cron in-Supabase (pgmq+pg_cron) · MCP server bawaan · Repliz.

## 📚 Dokumentasi
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — deploy **Vercel** atau **Dokploy** (mudah dipahami)
- [docs/MCP.md](docs/MCP.md) — sambungkan MCP ke Claude (lokal & saat deploy)
- [docs/API.md](docs/API.md) — endpoint app + Repliz
- [docs/WEBHOOK.md](docs/WEBHOOK.md) — webhook Repliz (auto-comment)
- [design-system/MASTER.md](design-system/MASTER.md) — design system

## ⚠️ Batas penting
Threads (via Repliz) membatasi ±**250 post / 24 jam per akun**. Setel **Post per hari** jauh di bawahnya. App menangani error rate-limit dan menandai job gagal.
