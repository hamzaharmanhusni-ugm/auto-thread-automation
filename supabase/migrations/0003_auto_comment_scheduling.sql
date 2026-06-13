-- Auto-comment scheduling: stagger inter-account comments with natural random
-- delays after a post goes live. Settings + a job queue processed by a cron
-- runner (/api/cron/auto-comment).

alter table public.workspace_settings
  add column if not exists auto_comment_enabled boolean not null default false,
  add column if not exists auto_comment_min_minutes integer not null default 2,
  add column if not exists auto_comment_max_minutes integer not null default 8;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.auto_comment_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_id uuid references public.contents(id) on delete cascade,
  commenter_account_id uuid not null references public.accounts(id) on delete cascade,
  repliz_content_id text not null,
  repliz_account_id text not null,
  comment_text text,
  run_at timestamptz not null,
  status text not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists auto_comment_jobs_due_idx on public.auto_comment_jobs (status, run_at);
create index if not exists auto_comment_jobs_content_idx on public.auto_comment_jobs (content_id);

alter table public.auto_comment_jobs enable row level security;

drop policy if exists auto_comment_jobs_select on public.auto_comment_jobs;
create policy auto_comment_jobs_select on public.auto_comment_jobs
  for select using (workspace_id in (select public.current_workspace_ids()));

drop trigger if exists set_updated_at_auto_comment_jobs on public.auto_comment_jobs;
create trigger set_updated_at_auto_comment_jobs
  before update on public.auto_comment_jobs
  for each row execute function public.set_updated_at();

comment on table public.auto_comment_jobs is
  'Scheduled inter-account comments (engagement). A cron runner posts due jobs to Repliz with natural staggered delays.';
