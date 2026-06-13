# ThreadsGrowth AI — Design System (MASTER)

Calm, trustworthy SaaS for **non-technical** users (creators, UMKM, doctors, consultants). Bahasa Indonesia. Built on Next.js 16 + Tailwind v4 + shadcn/ui (new-york).

## Principles
1. **Ramah & jelas** — plain-language labels, no jargon. Explain technical terms inline (tooltip "Apa itu persona?").
2. **Satu aksi utama per layar** — one primary CTA; secondary actions subordinate.
3. **Selalu beri umpan balik** — loading (skeleton >300ms), toast sukses/gagal, dialog konfirmasi untuk aksi destruktif.
4. **Tenang** — generous whitespace, soft shadows, rounded-lg, no clutter.

## Color (tokens in `app/globals.css`, oklch, light+dark)
- **Primary** Indigo — trust/brand. `bg-primary text-primary-foreground`.
- **Neutral** Slate — surfaces/text. Body text ≥ 4.5:1 contrast.
- **Semantic** — `success` (emerald), `warning` (amber), `destructive` (red). Always pair color with icon/text (never color-only).
- Use semantic tokens (`bg-card`, `text-muted-foreground`), never raw hex.

## Typography
- **Inter** (`--font-inter`). Base 16px. Scale: 12/14/16/18/24/30.
- Weights: headings 600–700, body 400, labels 500.
- **Tabular figures** for metrics/tables (`.tabular-nums`) to prevent layout shift.

## Spacing & layout
- 4/8px rhythm. Section spacing tiers 16/24/32/48.
- Container `max-w-7xl`. Cards `rounded-xl border bg-card p-6`.
- Sidebar nav ≥1024px; collapses to top bar on mobile.

## Navigation (Bahasa Indonesia labels)
Dashboard · Akun · Persona · Riset Ide · Konten · Kalender · Komentar · Pengaturan.
Active item highlighted (bg-sidebar-accent + primary text). Icon (Lucide) + label always.

## Components & patterns
- shadcn/ui: Button, Card, Badge, Tabs, Dialog, Avatar, Tooltip, Separator, Skeleton, Sonner (toast).
- **Empty states**: friendly heading + 1 sentence helper + primary CTA (e.g. "Belum ada akun. Hubungkan akun Threads pertamamu.").
- **Status badges**: map enum → friendly Indonesian + color (posted=hijau "Sudah Tayang", scheduled=indigo "Terjadwal", draft=abu "Draf", failed=merah "Gagal").
- **Onboarding stepper**: Dashboard → Tambah Akun → Buat Persona → Generate → Jadwalkan → Pantau.

## Accessibility (must)
- Contrast ≥ 4.5:1; visible focus rings; keyboard nav; aria-labels on icon-only buttons; respect `prefers-reduced-motion` (handled in globals.css).
- Touch targets ≥ 44px; helper text below complex inputs; errors below the field.

## Motion
- 150–300ms, transform/opacity only, ease-out enter. Reduced-motion respected globally.
