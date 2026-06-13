-- ============================================================================
-- ThreadsGrowth AI — full schema (consolidated migrations 01-08).
-- Apply to a fresh Supabase project with `supabase db push` (or paste into SQL editor).
-- ============================================================================

-- ---- Extensions ----
create extension if not exists pgcrypto with schema extensions;
create extension if not exists vector  with schema extensions;
create extension if not exists pg_net  with schema extensions;
create extension if not exists http    with schema extensions;
create extension if not exists pg_cron;
create extension if not exists pgmq;

-- ---- Enums ----
create type workspace_role_t       as enum ('admin','editor','viewer');
create type platform_t             as enum ('threads','x','linkedin','facebook','instagram','tiktok','youtube');
create type account_status_t       as enum ('active','inactive','disconnected','error');
create type post_type_t            as enum ('single','thread');
create type idea_status_t          as enum ('draft','approved','rejected','used');
create type content_status_t       as enum ('draft','scheduled','posted','failed','deleted');
create type schedule_status_t      as enum ('pending','scheduled','posted','failed','cancelled');
create type comment_reply_status_t as enum ('pending','approved','replied','failed','skipped');
create type auto_reply_mode_t      as enum ('manual','semi_auto','full_auto');
create type embedding_status_t     as enum ('pending','processing','completed','failed');
create type ai_provider_t          as enum ('gemini','openai','claude');
create type job_type_t             as enum ('idea_research','content_generation','comment_reply','embedding','schedule_push','schedule_delete','account_sync');
create type job_status_t           as enum ('queued','running','succeeded','failed','dead');
create type webhook_event_t        as enum ('comment','schedule','chat','unknown');

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- ---- Tenancy & RBAC ----
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, full_name text, avatar_url text,
  default_ai_provider ai_provider_t not null default 'gemini',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role workspace_role_t not null default 'editor',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);
create index idx_members_user on public.workspace_members(user_id);
create index idx_members_ws   on public.workspace_members(workspace_id);

create trigger trg_workspaces_updated before update on public.workspaces for each row execute function public.set_updated_at();
create trigger trg_profiles_updated   before update on public.profiles   for each row execute function public.set_updated_at();
create trigger trg_members_updated    before update on public.workspace_members for each row execute function public.set_updated_at();

create or replace function public.current_workspace_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select workspace_id from public.workspace_members where user_id = auth.uid();
$$;
create or replace function public.has_workspace_role(ws uuid, min_role workspace_role_t)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
      and (case m.role when 'admin' then 3 when 'editor' then 2 when 'viewer' then 1 end)
          >= (case min_role when 'admin' then 3 when 'editor' then 2 when 'viewer' then 1 end));
$$;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.create_workspace(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare ws_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.workspaces(name) values (p_name) returning id into ws_id;
  insert into public.workspace_members(workspace_id, user_id, role) values (ws_id, auth.uid(), 'admin');
  return ws_id;
end $$;

create or replace function public.ensure_default_membership()
returns uuid language plpgsql security definer set search_path = public as $$
declare ws uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select workspace_id into ws from public.workspace_members where user_id = auth.uid() limit 1;
  if ws is not null then return ws; end if;
  select id into ws from public.workspaces order by created_at limit 1;
  if ws is null then
    insert into public.workspaces(name, slug) values ('ThreadsGrowth AI', 'threadsgrowth') returning id into ws;
  end if;
  insert into public.workspace_members(workspace_id, user_id, role) values (ws, auth.uid(), 'admin')
    on conflict (workspace_id, user_id) do nothing;
  return ws;
end $$;

-- ---- Core business tables ----
create table public.repliz_credentials (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  label text, username_enc text not null, password_enc text not null,
  repliz_user_id text, is_default boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index idx_repliz_cred_ws on public.repliz_credentials(workspace_id);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  repliz_credential_id uuid references public.repliz_credentials(id) on delete set null,
  platform platform_t not null default 'threads',
  repliz_account_id text not null, repliz_user_id text,
  username text, display_name text, avatar_url text,
  status account_status_t not null default 'active',
  auto_reply_mode auto_reply_mode_t not null default 'manual',
  last_synced_at timestamptz, raw jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (workspace_id, platform, repliz_account_id)
);
create index idx_accounts_ws on public.accounts(workspace_id);
create index idx_accounts_repliz_id on public.accounts(repliz_account_id);
create index idx_accounts_ws_status on public.accounts(workspace_id, status);

create table public.personas (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null, description text, tone text, audience text, cta text,
  communication_style text, niche text, is_default boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index idx_personas_account on public.personas(account_id);
create index idx_personas_ws on public.personas(workspace_id);

create table public.knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  file_name text not null, storage_path text, mime_type text, file_size_bytes bigint,
  embedding_status embedding_status_t not null default 'pending', error_message text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index idx_kb_persona on public.knowledge_bases(persona_id);
create index idx_kb_ws on public.knowledge_bases(workspace_id);

create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  kb_id uuid not null references public.knowledge_bases(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  chunk_index int not null, content text not null, token_count int,
  embedding vector(768),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index idx_chunks_kb on public.knowledge_chunks(kb_id);
create index idx_chunks_ws on public.knowledge_chunks(workspace_id);
create index idx_chunks_embedding on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);

create table public.content_ideas (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  persona_id uuid references public.personas(id) on delete set null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null, angle text, hook text, niche text, topic text, cta text, emotion_type text,
  status idea_status_t not null default 'draft', ai_provider ai_provider_t, generated_by_job_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index idx_ideas_account on public.content_ideas(account_id);
create index idx_ideas_ws_status on public.content_ideas(workspace_id, status);

create table public.contents (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  idea_id uuid references public.content_ideas(id) on delete set null,
  persona_id uuid references public.personas(id) on delete set null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text, body text not null,
  post_type post_type_t not null default 'single',
  status content_status_t not null default 'draft',
  viral_score smallint check (viral_score between 1 and 10),
  suggested_comments text[], ai_provider ai_provider_t,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index idx_contents_account on public.contents(account_id);
create index idx_contents_ws_status on public.contents(workspace_id, status);

create table public.content_segments (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  position int not null, body text not null, media_urls text[] not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (content_id, position)
);
create index idx_segments_content on public.content_segments(content_id);

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.contents(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  repliz_schedule_id text, scheduled_at timestamptz not null,
  status schedule_status_t not null default 'pending', topic text,
  pushed_at timestamptz, posted_at timestamptz, last_error text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index idx_schedules_repliz on public.schedules(repliz_schedule_id);
create index idx_schedules_ws_status on public.schedules(workspace_id, status);
create index idx_schedules_due on public.schedules(scheduled_at) where status = 'pending';

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  content_id uuid references public.contents(id) on delete set null,
  schedule_id uuid references public.schedules(id) on delete set null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  repliz_comment_record_id text, platform_comment_id text, repliz_content_id text,
  commenter_username text, commenter_external_id text,
  comment_text text, comment_media_urls text[] not null default '{}',
  ai_reply text, ai_provider ai_provider_t,
  reply_status comment_reply_status_t not null default 'pending',
  replied_at timestamptz, received_at timestamptz not null default now(), raw jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (account_id, repliz_comment_record_id)
);
create index idx_comments_ws_status on public.comments(workspace_id, reply_status);
create index idx_comments_repliz_content on public.comments(repliz_content_id);
create index idx_comments_account_recv on public.comments(account_id, received_at desc);

-- ---- Operational / monitoring ----
create table public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  job_type job_type_t not null, status job_status_t not null default 'queued',
  provider ai_provider_t, payload jsonb, result jsonb, error text,
  attempts int not null default 0, max_attempts int not null default 3,
  idempotency_key text unique, scheduled_for timestamptz,
  started_at timestamptz, finished_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index idx_jobs_ws_status on public.ai_jobs(workspace_id, status);
create index idx_jobs_type_status on public.ai_jobs(job_type, status);
alter table public.content_ideas
  add constraint content_ideas_job_fk foreign key (generated_by_job_id) references public.ai_jobs(id) on delete set null;

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'repliz', event_type webhook_event_t not null, external_id text,
  account_id uuid references public.accounts(id) on delete set null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  signature_valid boolean, processed boolean not null default false, processing_error text,
  headers jsonb, body jsonb not null, received_at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (provider, event_type, external_id)
);
create index idx_webhook_ws on public.webhook_events(workspace_id);
create index idx_webhook_unprocessed on public.webhook_events(processed) where processed = false;

create table public.error_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  source text not null, severity text not null default 'error',
  http_status int, endpoint text, message text, context jsonb,
  related_job_id uuid references public.ai_jobs(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index idx_errlogs_ws on public.error_logs(workspace_id, created_at desc);
create index idx_errlogs_source on public.error_logs(source);

-- ---- updated_at triggers ----
do $$ declare t text; begin
  foreach t in array array['repliz_credentials','accounts','personas','knowledge_bases','knowledge_chunks',
    'content_ideas','contents','content_segments','schedules','comments','ai_jobs','webhook_events','error_logs']
  loop execute format('create trigger trg_%1$s_updated before update on public.%1$s for each row execute function public.set_updated_at()', t); end loop;
end $$;

-- ---- workspace_id derivation (anti-spoof) ----
create or replace function public.derive_workspace_id()
returns trigger language plpgsql security definer set search_path = public as $$
declare parent_tbl text := TG_ARGV[0]; fk_col text := TG_ARGV[1]; fk_val uuid; ws uuid;
begin
  execute format('select ($1).%I', fk_col) into fk_val using new;
  if fk_val is null then raise exception 'derive_workspace_id: %.% is null', TG_TABLE_NAME, fk_col; end if;
  execute format('select workspace_id from public.%I where id = $1', parent_tbl) into ws using fk_val;
  if ws is null then raise exception 'derive_workspace_id: parent %(%) not found', parent_tbl, fk_val; end if;
  new.workspace_id := ws; return new;
end $$;
revoke all on function public.derive_workspace_id() from public, anon, authenticated;

create trigger trg_personas_ws  before insert or update of account_id on public.personas         for each row execute function public.derive_workspace_id('accounts','account_id');
create trigger trg_kb_ws        before insert or update of persona_id on public.knowledge_bases   for each row execute function public.derive_workspace_id('personas','persona_id');
create trigger trg_chunks_ws    before insert or update of kb_id      on public.knowledge_chunks  for each row execute function public.derive_workspace_id('knowledge_bases','kb_id');
create trigger trg_ideas_ws     before insert or update of account_id on public.content_ideas     for each row execute function public.derive_workspace_id('accounts','account_id');
create trigger trg_contents_ws  before insert or update of account_id on public.contents          for each row execute function public.derive_workspace_id('accounts','account_id');
create trigger trg_segments_ws  before insert or update of content_id on public.content_segments  for each row execute function public.derive_workspace_id('contents','content_id');
create trigger trg_schedules_ws before insert or update of account_id on public.schedules         for each row execute function public.derive_workspace_id('accounts','account_id');
create trigger trg_comments_ws  before insert or update of account_id on public.comments          for each row execute function public.derive_workspace_id('accounts','account_id');

-- ---- RLS ----
do $$ declare t text; begin
  foreach t in array array['workspaces','profiles','workspace_members','repliz_credentials','accounts','personas',
    'knowledge_bases','knowledge_chunks','content_ideas','contents','content_segments','schedules','comments',
    'ai_jobs','webhook_events','error_logs']
  loop execute format('alter table public.%I enable row level security', t); end loop;
end $$;

create policy workspaces_sel on public.workspaces for select using (id in (select public.current_workspace_ids()));
create policy workspaces_ins on public.workspaces for insert with check (auth.uid() is not null);
create policy workspaces_upd on public.workspaces for update using (public.has_workspace_role(id,'admin')) with check (public.has_workspace_role(id,'admin'));
create policy workspaces_del on public.workspaces for delete using (public.has_workspace_role(id,'admin'));

create policy profiles_sel on public.profiles for select using (
  id = auth.uid() or exists (select 1 from public.workspace_members m1
    join public.workspace_members m2 on m1.workspace_id = m2.workspace_id
    where m1.user_id = auth.uid() and m2.user_id = profiles.id));
create policy profiles_ins on public.profiles for insert with check (id = auth.uid());
create policy profiles_upd on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy members_self_sel on public.workspace_members for select using (user_id = auth.uid());
create policy members_ins on public.workspace_members for insert with check (public.has_workspace_role(workspace_id,'admin'));
create policy members_upd on public.workspace_members for update using (public.has_workspace_role(workspace_id,'admin')) with check (public.has_workspace_role(workspace_id,'admin'));
create policy members_del on public.workspace_members for delete using (public.has_workspace_role(workspace_id,'admin'));

create policy repliz_credentials_sel on public.repliz_credentials for select using (workspace_id in (select public.current_workspace_ids()));
create policy repliz_credentials_ins on public.repliz_credentials for insert with check (public.has_workspace_role(workspace_id,'admin'));
create policy repliz_credentials_upd on public.repliz_credentials for update using (public.has_workspace_role(workspace_id,'admin')) with check (public.has_workspace_role(workspace_id,'admin'));
create policy repliz_credentials_del on public.repliz_credentials for delete using (public.has_workspace_role(workspace_id,'admin'));

do $$ declare t text; begin
  foreach t in array array['accounts','personas','knowledge_bases','knowledge_chunks','content_ideas',
    'contents','content_segments','schedules','comments','ai_jobs']
  loop
    execute format($f$create policy %1$s_sel on public.%1$s for select using (workspace_id in (select public.current_workspace_ids()))$f$, t);
    execute format($f$create policy %1$s_ins on public.%1$s for insert with check (public.has_workspace_role(workspace_id,'editor'))$f$, t);
    execute format($f$create policy %1$s_upd on public.%1$s for update using (public.has_workspace_role(workspace_id,'editor')) with check (public.has_workspace_role(workspace_id,'editor'))$f$, t);
    execute format($f$create policy %1$s_del on public.%1$s for delete using (public.has_workspace_role(workspace_id,'editor'))$f$, t);
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['webhook_events','error_logs']
  loop execute format($f$create policy %1$s_sel on public.%1$s for select using (workspace_id in (select public.current_workspace_ids()))$f$, t); end loop;
end $$;

-- ---- RAG + dashboard RPCs ----
create or replace function public.match_knowledge_chunks(p_persona_id uuid, p_query_embedding vector(768), p_k int default 5)
returns table(id uuid, kb_id uuid, content text, similarity float)
language sql stable security definer set search_path = public, extensions as $$
  select c.id, c.kb_id, c.content, 1 - (c.embedding <=> p_query_embedding) as similarity
  from public.knowledge_chunks c join public.knowledge_bases kb on kb.id = c.kb_id
  where kb.persona_id = p_persona_id and c.workspace_id in (select public.current_workspace_ids())
    and c.embedding is not null
  order by c.embedding <=> p_query_embedding limit p_k;
$$;

create or replace function public.dashboard_metrics(p_workspace_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare result jsonb;
begin
  if not (p_workspace_id in (select public.current_workspace_ids())) then
    raise exception 'not a member of workspace %', p_workspace_id; end if;
  select jsonb_build_object(
    'accounts_total',(select count(*) from accounts where workspace_id=p_workspace_id),
    'accounts_active',(select count(*) from accounts where workspace_id=p_workspace_id and status='active'),
    'content_draft',(select count(*) from contents where workspace_id=p_workspace_id and status='draft'),
    'content_scheduled',(select count(*) from contents where workspace_id=p_workspace_id and status='scheduled'),
    'content_posted',(select count(*) from contents where workspace_id=p_workspace_id and status='posted'),
    'content_failed',(select count(*) from contents where workspace_id=p_workspace_id and status='failed'),
    'ideas_generated',(select count(*) from content_ideas where workspace_id=p_workspace_id),
    'comments_received',(select count(*) from comments where workspace_id=p_workspace_id),
    'comments_replied',(select count(*) from comments where workspace_id=p_workspace_id and reply_status='replied'),
    'reply_rate',(select case when count(*)=0 then 0 else round(100.0*count(*) filter (where reply_status='replied')/count(*),1) end from comments where workspace_id=p_workspace_id),
    'api_errors',(select count(*) from error_logs where workspace_id=p_workspace_id and source='repliz_api'),
    'webhook_errors',(select count(*) from error_logs where workspace_id=p_workspace_id and source='webhook'),
    'failed_jobs',(select count(*) from ai_jobs where workspace_id=p_workspace_id and status in ('failed','dead'))
  ) into result; return result;
end $$;

grant execute on function public.match_knowledge_chunks(uuid, vector, int) to authenticated;
grant execute on function public.dashboard_metrics(uuid) to authenticated;
grant execute on function public.create_workspace(text) to authenticated;
grant execute on function public.ensure_default_membership() to authenticated;
revoke all on function public.ensure_default_membership() from anon;

-- ---- Queue (pgmq) + scheduler cron ----
select pgmq.create('ai_jobs');

create or replace function public.enqueue_due_schedules()
returns int language plpgsql security definer set search_path = public as $$
declare n int := 0; r record;
begin
  for r in select s.id, s.workspace_id, s.account_id from public.schedules s
           where s.status='pending' and s.scheduled_at <= now() loop
    insert into public.ai_jobs(workspace_id, account_id, job_type, status, payload, idempotency_key)
    values (r.workspace_id, r.account_id, 'schedule_push', 'queued',
            jsonb_build_object('schedule_id', r.id), 'sched:'||r.id::text)
    on conflict (idempotency_key) do nothing;
    if found then
      perform pgmq.send('ai_jobs', jsonb_build_object('job_type','schedule_push','schedule_id', r.id));
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;
revoke all on function public.enqueue_due_schedules() from public, anon, authenticated;

select cron.schedule('enqueue-due-schedules', '* * * * *', $$select public.enqueue_due_schedules();$$);
