# ThreadsGrowth AI

Web app untuk **mengelola & mengotomatiskan akun Threads**: buat persona, generate ide & konten (single / nested), jadwalkan, dan balas komentar otomatis. Semua dari satu tempat, ditenagai AI dan bisa dikendalikan lewat **MCP** (Claude Desktop, Claude Code, Cursor, OpenCode).

Integrasi Threads lewat **Repliz** (auto-schedule, auto-comment, komentar antar akun). Generate konten bisa lewat **AI bawaan** (Gemini) atau lewat **MCP** (asisten AI-mu yang mengerjakannya).

---

## ✨ Fitur

- **Onboarding ramah**: modal sambutan sekali, checklist langkah di Dashboard, halaman **Panduan** lengkap, dan tooltip "?" di istilah teknis.
- **Akun**: sinkron akun Threads dari Repliz, atur mode balas otomatis per akun.
- **Persona**: buat/edit/hapus persona (nama, nada, audiens, gaya, CTA). Wajib sebelum generate.
- **Riset Ide & Konten**: AI menghasilkan ide lalu mengubahnya jadi konten **single** atau **nested (thread)**.
- **Kalender**: tarik-lepas untuk menjadwalkan, plus **buat/generate konten manual langsung dari tanggal**.
- **Konten**: lihat, jadwalkan, **hapus** (dengan konfirmasi), dan lihat statistik.
- **Komentar (Auto Comment)**: mode Manual / Semi Otomatis / Otomatis Penuh (dengan konfirmasi keamanan).
- **Komentar antar akun**: akun lain yang terhubung Repliz ikut berkomentar untuk engagement (manual dari UI atau lewat MCP).
- **Analitik**: ringkasan engagement + performa per konten (views, suka, bagikan, komentar).
- **Pengaturan**: kredensial Repliz, kunci AI, otomasi, **token MCP (bisa auto-generate dari UI)**, undang anggota lewat email.

---

## 🚀 Cara memulai (lokal)

```bash
# 1. Install
npm install

# 2. Konfigurasi env
cp .env.example .env.local   # lalu isi nilainya
```

Isi `.env.local` minimal:

| Variabel | Untuk |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Database & auth (Supabase) |
| `REPLIZ_USERNAME`, `REPLIZ_PASSWORD` | Default Repliz (bisa juga diisi dari UI) |
| `GEMINI_API_KEY` | Generate konten/komentar dengan AI bawaan (bisa juga diisi dari UI) |
| `APP_URL` | URL publik app (mengisi otomatis URL MCP di panduan) |
| `MCP_AUTH_TOKEN` | Opsional. Kalau kosong, token bisa **dibuat dari UI** (Pengaturan) |

```bash
# 3. Siapkan database (sekali). Lihat docs/DEPLOYMENT.md bagian Database.
# 4. Jalankan
npm run dev    # http://localhost:3000
```

**Langkah pertama di app** (juga muncul sebagai checklist di Dashboard):
1. **Pengaturan** → isi kredensial **Repliz** + **kunci AI** (atau pakai .env).
2. **Akun** → Sinkronkan akun Threads dari Repliz.
3. **Persona** → buat minimal satu persona per akun.
4. **Riset Ide** → generate ide, lalu jadikan konten (single / nested). Atau tulis manual dari **Kalender**.
5. **Kalender** → jadwalkan. **Dashboard / Analitik** → pantau hasilnya.

---

## 🤖 Kendalikan lewat AI (MCP)

Sambungkan **Claude Desktop, Claude Code, Cursor, atau OpenCode** ke MCP server app ini, lalu minta:
*"Pakai threadsgrowth: ambil persona akun X, buat 3 ide, jadikan konten single & nested, jadwalkan, dan setelah tayang komentari antar akun."*

Tools yang tersedia: `get_persona`, `list_recent_titles`, `get_automation_settings`, `create_idea`, `create_content`, `schedule_content`, `list_pending_comments`, `submit_comment_reply`, **`seed_comments`** (komentar antar akun), dll.

Cara menyambungkan (config siap-tempel per aplikasi + token) ada langsung di **Pengaturan → Kendalikan lewat AI**, dan versi lengkapnya di **Panduan** (`/panduan#mcp`) serta [docs/MCP.md](docs/MCP.md). Token MCP bisa **dibuat otomatis dari UI** kalau `MCP_AUTH_TOKEN` tidak diset.

---

## 👥 Akses tim

- User **pertama** = admin.
- Undang anggota lewat **email** (Pengaturan → Undang Anggota) → tautan `/invite/<token>`. Email yang diundang tampil jelas.
- **Lupa kata sandi**: tautan di halaman masuk → email reset.

---

## 🧱 Stack
Next.js 16 (App Router) · TypeScript · Tailwind v4 + shadcn/ui · Supabase (Postgres+pgvector, Auth, Storage, Edge Functions) · queue/cron in-Supabase (pgmq+pg_cron) · MCP server bawaan · Repliz · Gemini.

## 📚 Dokumentasi
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — deploy **Vercel** atau **Dokploy** + **migrasi database**
- [docs/MCP.md](docs/MCP.md) — sambungkan MCP ke Claude/Cursor/OpenCode (lokal & saat deploy)
- [docs/API.md](docs/API.md) — endpoint app + Repliz
- [docs/WEBHOOK.md](docs/WEBHOOK.md) — webhook Repliz (auto-comment)
- [design-system/MASTER.md](design-system/MASTER.md) — design system

## ⚠️ Batas penting
Threads (via Repliz) membatasi ±**250 post / 24 jam per akun**. Setel **Post per hari** jauh di bawahnya. App menangani error rate-limit dan menampilkan notifikasi.
