-- Per-workspace cron token for the auto-comment runner (/api/cron/auto-comment),
-- managed from the app UI (Pengaturan -> Otomasi) when CRON_SECRET env is unset.

alter table public.workspace_settings
  add column if not exists cron_secret text;

comment on column public.workspace_settings.cron_secret is
  'Per-workspace cron token for /api/cron/auto-comment, set/generated from the app UI when CRON_SECRET env is not set.';
