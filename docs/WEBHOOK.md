# Webhook Repliz

Menggantikan workflow n8n **WF3 (Auto Comment)**. Repliz mengirim event ke aplikasi; aplikasi menyimpan, memproses, dan (untuk komentar) menyiapkan balasan AI.

## Endpoint

```
POST /api/webhooks/repliz?secret=<REPLIZ_WEBHOOK_SECRET>
GET  /api/webhooks/repliz        # health check -> { ok: true, endpoint: "repliz-webhook" }
```

Implementasi: [`app/api/webhooks/repliz/route.ts`](../app/api/webhooks/repliz/route.ts) (runtime Node, service-role, idempoten).

## Keamanan

Verifikasi (lihat [`lib/repliz/webhook.ts`](../lib/repliz/webhook.ts)) — dua mekanisme:

1. **Shared secret di URL**: `?secret=...` dibandingkan dengan `REPLIZ_WEBHOOK_SECRET`.
2. **HMAC** header `x-repliz-signature: sha256=<hex>` atas raw body (jika Repliz mendukung).

Jika `REPLIZ_WEBHOOK_SECRET` kosong → verifikasi dilewati (hanya untuk dev).

## Tipe Event (`body.type`)

| type | Aksi aplikasi |
|---|---|
| `comment` | Simpan komentar (idempoten) → siapkan balasan AI sesuai `auto_reply_mode` akun |
| `schedule` | Tandai jadwal & konten sebagai `posted` (cocokkan `repliz_schedule_id`) |
| `chat` | Disimpan di log (`webhook_events`) — handler DM menyusul |

## Struktur Payload

```jsonc
{
  "platform": "threads",
  "type": "comment",                 // comment | schedule | chat
  "accountId": "69fbf808877ca2e45403d701",
  "data": {
    "id": "6a1...",                  // ID record komentar = TARGET balasan (POST /public/comment/{id})
    "userId": "...",
    "content": {                     // postingan terkait
      "id": "6a0d206e...",           // ID konten platform (Threads)
      "title": "...", "description": "...", "topic": "...",
      "owner": { "id": "...", "name": "...", "picture": "..." },
      "url": "...", "createdAt": "..."
    },
    "comment": {
      "id": "...",                   // ID komentar platform
      "type": "text",                // text | image
      "text": "Komentarnya ...",
      "owner": { "id": "...", "name": "...", "picture": "..." },
      "medias": [{ "url": "https://..." }],
      "createdAt": "..."
    }
  }
}
```

> **Penting**: balasan dikirim ke `POST /public/comment/{data.id}` — yaitu **`data.id`** (ID record komentar di Repliz), bukan `data.comment.id` (ID komentar platform).

## Idempotensi

Setiap event dicatat di `webhook_events` dengan kunci unik `(provider, event_type, external_id)` (`external_id = data.id`). Pengiriman ganda dikenali dan dilewati (respons `{ ok: true, duplicate: true }`).

## Mode Balas Otomatis (per akun, kolom `accounts.auto_reply_mode`)

| Mode | Perilaku |
|---|---|
| `manual` | Komentar disimpan; balasan dibuat manual di Inbox |
| `semi_auto` | AI membuat draf balasan; menunggu persetujuan |
| `full_auto` | AI membalas otomatis lalu kirim ke Repliz |

> Generate + kirim balasan dijalankan oleh **worker queue** (fase berikutnya). Webhook saat ini menyimpan komentar dengan status `pending`.

## Uji lokal

```bash
curl -X POST "http://localhost:3000/api/webhooks/repliz?secret=$REPLIZ_WEBHOOK_SECRET" \
  -H "content-type: application/json" \
  -d '{"platform":"threads","type":"comment","accountId":"69fbf808877ca2e45403d701",
       "data":{"id":"test-123","comment":{"id":"c1","type":"text","text":"Halo!","owner":{"id":"u1","name":"Budi"}},"content":{"id":"x1"}}}'
```
