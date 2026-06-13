-- Weekly auto-scheduler: posting days + times, plus an idempotency log. A cron
-- (/api/cron/auto-schedule) pre-schedules the oldest drafts into upcoming slots
-- via Repliz (which publishes at the slot time).

alter table public.workspace_settings
  add column if not exists auto_schedule_enabled boolean not null default false,
  add column if not exists posting_days integer[] not null default '{1,3,5}',   -- ISO: 1=Mon .. 7=Sun
  add column if not exists posting_times text[] not null default '{08:00}';      -- WIB "HH:MM"

create table if not exists public.auto_schedule_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  slot_at timestamptz not null,
  content_id uuid references public.contents(id) on delete set null,
  schedule_id uuid references public.schedules(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (workspace_id, slot_at)
);

create index if not exists auto_schedule_runs_ws_idx on public.auto_schedule_runs (workspace_id, slot_at);

alter table public.auto_schedule_runs enable row level security;
drop policy if exists auto_schedule_runs_select on public.auto_schedule_runs;
create policy auto_schedule_runs_select on public.auto_schedule_runs
  for select using (workspace_id in (select public.current_workspace_ids()));

comment on table public.auto_schedule_runs is
  'Idempotency log for the weekly auto-scheduler: one row per filled posting slot.';
