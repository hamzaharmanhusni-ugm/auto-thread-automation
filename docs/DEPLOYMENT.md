# Deployment — Vercel atau Dokploy

App = **Next.js** + **Supabase** (DB, Auth, queue/cron, Edge Functions) + **Repliz** (Threads). Pilih hosting: **Vercel** (paling cepat) atau **Dokploy** (self-host di VPS-mu). Database berbasis **migrasi**, jadi mudah dipindah/di-deploy.

---

## 0. Database (sekali) — migrasi otomatis saat deploy

App ini memakai **Supabase**. Ada dua kemungkinan:

**A. Pakai project Supabase yang sudah ada (paling umum).**
Kalau kamu memakai `.env` yang sudah disediakan (mengarah ke project Supabase tim), **database sudah dimigrasi** — tidak ada langkah tambahan. Lanjut ke Environment Variables.

**B. Project Supabase baru (fresh).**
Terapkan migrasi ke project barumu. Pilih salah satu:

```bash
# Cara 1: Supabase CLI (disarankan, idempotent)
supabase link --project-ref <REF>
supabase db push        # menerapkan semua file di supabase/migrations/ secara urut
```

```text
# Cara 2: tanpa CLI
Buka Supabase Dashboard → SQL Editor → tempel isi tiap file
supabase/migrations/0001_init.sql lalu 0002_*.sql (urut) → Run.
```

Setelah migrasi:
1. Aktifkan **Email auth** (Authentication → Providers → Email).
2. Ambil 3 kunci di Project Settings → API: `Project URL`, `publishable key` (anon), `service_role` (rahasia) → isi ke Environment Variables.
3. (Opsional) data demo: jalankan [`scripts/import_from_sheet.sql`](../scripts/import_from_sheet.sql).

> Catatan: skema adalah **source of truth** di project Supabase. Untuk menyalin skema project lama ke project baru secara presisi, `supabase db pull` dari project lama lalu `supabase db push` ke project baru.

---

## Environment Variables (sama untuk Vercel & Dokploy)

| Nama | Wajib | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **server only** |
| `USER_EMAIL_DEFAULT` | ✅ | email admin pertama (yang boleh daftar) |
| `USER_ALLOW_REGISTRATION` | ➖ | `false` (default) = anggota lain via undangan |
| `MCP_AUTH_TOKEN` | ➖ | integrasi MCP. **Kalau kosong, token bisa dibuat dari UI** (Pengaturan → Kendalikan lewat AI) |
| `REPLIZ_USERNAME`, `REPLIZ_PASSWORD` | ➖ | default Repliz (bisa diisi dari UI) |
| `REPLIZ_WEBHOOK_SECRET` | ✅* | verifikasi webhook auto-comment |
| `GEMINI_API_KEY` | ➖ | generate konten/komentar dengan AI (bisa diisi dari UI) |
| `APP_URL` | ✅* | URL publik app — mengisi otomatis URL MCP di panduan setelah deploy |

\* sangat disarankan. Setelah deploy, isi `APP_URL` dengan domain final agar config MCP di UI langsung benar.

---

## A. Deploy ke **Vercel**

1. Push repo ke GitHub, lalu **Import Project** di [vercel.com](https://vercel.com). Framework: **Next.js** (otomatis).
2. Tambahkan semua Environment Variables di atas (scope Production + Preview).
3. **Deploy**. Vercel auto-deploy tiap push ke `main`; tiap PR → Preview URL.
4. (Opsional) Custom domain di Settings → Domains.

Selesai. Tidak perlu konfigurasi build khusus.

---

## B. Deploy ke **Dokploy** (self-host VPS)

[Dokploy](https://dokploy.com) = panel self-host (mirip Vercel/Heroku) di VPS-mu.

1. **Buat Application** → sumber **GitHub** (pilih repo) atau **Docker**.
2. **Build**: pilih **Nixpacks** (otomatis mendeteksi Next.js) — Build `npm run build`, Start `npm run start`. Port **3000**.
3. **Environment**: tempel semua variabel di atas.
4. **Domain**: tambahkan domain + aktifkan **HTTPS (Let's Encrypt)** di tab Domains.
5. **Deploy**. Aktifkan **Auto Deploy** (webhook GitHub) agar update tiap push.

> Jika pakai Dockerfile sendiri: base `node:22-alpine`, `npm ci && npm run build`, jalankan `npm run start -- -p 3000`. Next.js 16 standalone juga didukung.

---

## C. Webhook Repliz (auto-comment)

Daftarkan URL ini di dashboard Repliz (sekali):
```
https://<domain>/api/webhooks/repliz?secret=<REPLIZ_WEBHOOK_SECRET>
```
Cek: `GET https://<domain>/api/webhooks/repliz` → `{ "ok": true }`. Detail: [WEBHOOK.md](WEBHOOK.md).

---

## D. Worker penjadwal (Supabase Edge Function)

Cron `enqueue-due-schedules` + Edge Function `queue-worker` sudah ada. Set secret-nya:
```bash
supabase secrets set WORKER_SECRET=<token> REPLIZ_USERNAME=<...> REPLIZ_PASSWORD=<...>
```
Aktifkan drain otomatis (SQL Editor):
```sql
select cron.schedule('drain-ai-jobs','* * * * *', $$
  select net.http_post(
    url := 'https://<ref>.supabase.co/functions/v1/queue-worker',
    headers := jsonb_build_object('Authorization','Bearer <WORKER_SECRET>','Content-Type','application/json'),
    body := '{}'::jsonb);
$$);
```
> Worker menghormati batas Threads (±250 post/24 jam) dan menandai job gagal bila kena rate-limit.

---

## E. Akses MCP setelah deploy (Vercel & Dokploy)

MCP server ikut ter-deploy di `https://<domain>/api/mcp`. Yang perlu disiapkan:
1. **Token**: set env `MCP_AUTH_TOKEN`, **atau** kosongkan dan buat token dari **Pengaturan → Kendalikan lewat AI → Generate otomatis** (admin).
2. Set `APP_URL` ke domain final agar config di UI memakai URL yang benar otomatis.
3. Pastikan domain HTTPS aktif.
4. Sambungkan dari aplikasimu — **config siap-tempel ada di halaman Pengaturan** (pilih Claude Desktop / Claude Code / Cursor / OpenCode). Contoh Claude Code:
   ```bash
   claude mcp add threadsgrowth --transport http https://<domain>/api/mcp \
     --header "Authorization: Bearer <TOKEN>"
   ```

MCP otomatis tersedia di domain yang sama dengan app, baik di Vercel maupun Dokploy. Detail per aplikasi: [MCP.md](MCP.md) atau halaman **Panduan** (`/panduan#mcp`).

---

## E2. Auto-comment otomatis saat tayang (cron)

Supaya komentar antar akun terkirim otomatis dengan jeda acak yang natural setelah konten tayang:

1. Set env **`CRON_SECRET`** (string acak panjang) di hosting.
2. Nyalakan di app: **Pengaturan → Otomasi → "Komentar antar akun otomatis saat tayang"**, atur jeda (mis. 2 sampai 8 menit) dan jumlah akun.
3. Pastikan **webhook Repliz** terpasang (bagian C) — itu pemicu saat konten benar-benar tayang.
4. Aktifkan runner tiap menit:

**Vercel** — sudah ada di [`vercel.json`](../vercel.json):
```json
{ "crons": [{ "path": "/api/cron/auto-comment", "schedule": "* * * * *" }] }
```
Vercel Cron otomatis mengirim header `Authorization: Bearer <CRON_SECRET>`. Catatan: paket **Hobby** membatasi cron 1x/hari; untuk per-menit pakai paket **Pro**, atau gunakan pg_cron di bawah.

**Supabase pg_cron / Dokploy** (alternatif, per menit):
```sql
select cron.schedule('auto-comment','* * * * *', $$
  select net.http_post(
    url := 'https://<domain>/api/cron/auto-comment',
    headers := jsonb_build_object('Authorization','Bearer <CRON_SECRET>'));
$$);
```

Cek manual: `curl "https://<domain>/api/cron/auto-comment?key=<CRON_SECRET>"` → `{ ok: true, processed, posted }`.

> Cara kerja: webhook "post tayang" menjadwalkan N komentar dari akun lain dengan `run_at` acak berurutan (staggered). Runner memproses yang sudah jatuh tempo, generate teks per persona (AI) atau pakai komentar pemicu konten, lalu kirim ke Repliz.

---

## F. Verifikasi
```bash
curl https://<domain>/api/health            # { ok: true }
curl https://<domain>/api/webhooks/repliz    # { ok: true }
```
Buka `https://<domain>` → daftar admin → Pengaturan (isi kredensial) → Akun (sync) → Kalender. Cek Supabase → Advisors (Security) bersih.
