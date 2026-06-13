# Deployment — Vercel atau Dokploy

App = **Next.js** + **Supabase** (DB, Auth, queue/cron, Edge Functions) + **Repliz** (Threads). Pilih hosting: **Vercel** (paling cepat) atau **Dokploy** (self-host di VPS-mu). Database berbasis **migrasi**, jadi mudah dipindah/di-deploy.

---

## 0. Siapkan Database (sekali, untuk semua hosting)

Skema lengkap ada di [`supabase/migrations/`](../supabase/migrations/). Terapkan ke project Supabase-mu:

```bash
supabase link --project-ref <REF>
supabase db push
```
atau tempel isi file `supabase/migrations/*.sql` (urut) ke **SQL Editor** Supabase lalu Run.

Lalu aktifkan **Email auth** (Authentication → Providers → Email). Ambil 3 kunci di Project Settings → API:
`Project URL`, `publishable key` (anon), `service_role` (rahasia).

> Data demo (opsional): jalankan [`scripts/import_from_sheet.sql`](../scripts/import_from_sheet.sql).

---

## Environment Variables (sama untuk Vercel & Dokploy)

| Nama | Wajib | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **server only** |
| `USER_EMAIL_DEFAULT` | ✅ | email admin pertama (yang boleh daftar) |
| `USER_ALLOW_REGISTRATION` | ➖ | `false` (default) = anggota lain via undangan |
| `MCP_AUTH_TOKEN` | ✅* | aktifkan integrasi MCP (Claude/Codex) |
| `REPLIZ_USERNAME`, `REPLIZ_PASSWORD` | ➖ | default Repliz (bisa diisi dari UI) |
| `REPLIZ_WEBHOOK_SECRET` | ✅* | verifikasi webhook auto-comment |
| `GEMINI_API_KEY` | ➖ | hanya jika pakai generate manual (MCP tidak perlu) |
| `APP_URL` | ➖ | URL publik app |

\* sangat disarankan.

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

MCP server ikut ter-deploy di `https://<domain>/api/mcp`. Yang perlu disiapkan saat deploy:
1. Set env `MCP_AUTH_TOKEN` di Vercel/Dokploy (token rahasia panjang).
2. Pastikan domain HTTPS aktif.
3. Sambungkan dari Claude (lihat [MCP.md](MCP.md)):
   ```bash
   claude mcp add threadsgrowth --transport http https://<domain>/api/mcp \
     --header "Authorization: Bearer <MCP_AUTH_TOKEN>"
   ```

Itu saja — MCP otomatis tersedia di domain yang sama dengan app, baik di Vercel maupun Dokploy.

---

## F. Verifikasi
```bash
curl https://<domain>/api/health            # { ok: true }
curl https://<domain>/api/webhooks/repliz    # { ok: true }
```
Buka `https://<domain>` → daftar admin → Pengaturan (isi kredensial) → Akun (sync) → Kalender. Cek Supabase → Advisors (Security) bersih.
