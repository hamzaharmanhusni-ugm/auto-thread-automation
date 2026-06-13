-- ============================================================================
-- One-off data migration: legacy Google Sheet (n8n DB) -> Supabase
-- Pulls the "Content" tab directly via the `http` extension (gviz JSON),
-- transforms (clean body, parse viral score, split thread by "POST n/:",
-- parse "Koment :" comments, WIB->UTC), and inserts into the relational schema.
--
-- Idempotent: truncates contents (cascade) then re-imports all rows.
-- Prereq: accounts + personas already seeded (workspace bc168911-...).
-- Run with: supabase MCP execute_sql, or psql against the project.
-- Source sheet id: 1nPBlJGeF1qQyXRclBnEkPGqVjeMbXO05wTbCNnFJonI  (gid 975653450)
-- ============================================================================
create extension if not exists http with schema extensions;

do $$
declare
  ws uuid := 'bc168911-a236-5fcc-8c11-38b6f29ffd39';
  rec record;
  v_acc uuid; v_per uuid; v_cid uuid;
  v_body text; v_viral int; v_ptype post_type_t; v_status content_status_t;
  v_sstatus schedule_status_t; v_sched timestamptz;
  segs text[]; komens text[]; i int;
begin
  truncate public.contents cascade;  -- clears contents + content_segments + schedules

  for rec in
    with raw as (
      select (extensions.http_get('https://docs.google.com/spreadsheets/d/1nPBlJGeF1qQyXRclBnEkPGqVjeMbXO05wTbCNnFJonI/gviz/tq?tqx=out:json&gid=975653450')).content as b
    ),
    js as (select (regexp_match((select b from raw), 'setResponse\((.*)\);'))[1]::jsonb as j),
    rws as (select jsonb_array_elements(j->'table'->'rows') as r from js)
    select
      r->'c'->0->>'v'  as id_account,
      r->'c'->3->>'v'  as content_id,
      r->'c'->4->>'v'  as title,
      r->'c'->5->>'v'  as content,
      r->'c'->6->>'v'  as sched,
      r->'c'->7->>'v'  as tipe,
      r->'c'->8->>'v'  as status,
      r->'c'->10->>'v' as k1,
      r->'c'->11->>'v' as k2,
      r->'c'->12->>'v' as k3
    from rws
  loop
    if rec.id_account is null or rec.id_account = 'Template Data'
       or rec.content_id is null or rec.content_id = 'gc-0001' then
      continue;
    end if;

    select id into v_acc from public.accounts
      where workspace_id = ws and repliz_account_id = rec.id_account limit 1;
    if v_acc is null then continue; end if;
    select id into v_per from public.personas
      where account_id = v_acc order by is_default desc, created_at limit 1;

    v_viral  := nullif(substring(coalesce(rec.content,'') from 'Skor Viral:\s*(\d+)'), '')::int;
    v_body   := btrim(regexp_replace(coalesce(rec.content,''), '\[\s*Skor Viral:[^\]]*\]', '', 'gi'));
    v_ptype  := case lower(coalesce(rec.tipe,'')) when 'nested' then 'thread' else 'single' end;
    v_status := case btrim(coalesce(rec.status,''))
                  when 'Sudah Dipost' then 'posted'
                  when 'Sudah Dijadwalkan' then 'scheduled'
                  when 'Sudah Dihapus' then 'deleted'
                  else 'draft' end;
    v_sstatus := case btrim(coalesce(rec.status,''))
                  when 'Sudah Dipost' then 'posted'
                  when 'Sudah Dijadwalkan' then 'scheduled'
                  when 'Sudah Dihapus' then 'cancelled'
                  else 'pending' end;

    if v_ptype = 'thread' then
      segs := array(select btrim(s) from unnest(regexp_split_to_array(v_body, 'POST\s*\d+\s*/\s*:?')) s where btrim(s) <> '');
    else
      segs := array[v_body];
    end if;
    if coalesce(array_length(segs,1),0) = 0 then segs := array[v_body]; end if;

    komens := array(
      select btrim(regexp_replace(x, '^.*?Koment\s*:\s*', '', 'is'))
      from unnest(array[rec.k1, rec.k2, rec.k3]) x
      where x is not null and btrim(x) <> ''
    );

    begin
      v_sched := to_timestamp(btrim(rec.sched), 'MM/DD/YYYY HH24:MI') - interval '7 hours';
    exception when others then v_sched := null; end;

    v_cid := gen_random_uuid();
    insert into public.contents (id, account_id, persona_id, title, body, post_type, status, viral_score, suggested_comments)
      values (v_cid, v_acc, v_per, nullif(btrim(coalesce(rec.title,'')),''), segs[1], v_ptype, v_status, v_viral,
              case when array_length(komens,1) is null then null else komens end);

    for i in 1 .. array_length(segs,1) loop
      insert into public.content_segments (content_id, position, body) values (v_cid, i-1, segs[i]);
    end loop;

    if v_sched is not null then
      insert into public.schedules (content_id, account_id, repliz_schedule_id, scheduled_at, status, posted_at)
        values (v_cid, v_acc, rec.content_id, v_sched, v_sstatus,
                case when v_sstatus = 'posted' then v_sched else null end);
    end if;
  end loop;
end $$;
