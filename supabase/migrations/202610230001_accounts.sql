-- MigraMap: account-scoped diary and profile storage. Apply to the selected project.
begin;
create table if not exists public.migramap_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 email text not null default '', full_name text not null default '' check(length(full_name)<=120),
 phone text not null default '' check(length(phone)<=40),
 onboarding_completed_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.migramap_diaries (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{"days":[],"attacks":[]}'::jsonb,
 revision bigint not null default 0,
 updated_at timestamptz not null default now(),
 constraint migramap_diary_shape check (jsonb_typeof(data)='object' and data ? 'days' and data ? 'attacks' and jsonb_typeof(data->'days')='array' and jsonb_typeof(data->'attacks')='array')
);
alter table public.migramap_profiles enable row level security;
alter table public.migramap_diaries enable row level security;
revoke all on public.migramap_profiles,public.migramap_diaries from anon;
grant select,insert,update on public.migramap_profiles,public.migramap_diaries to authenticated;
create policy migramap_profile_owner on public.migramap_profiles for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy migramap_diary_owner on public.migramap_diaries for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create or replace function public.migramap_bootstrap() returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 insert into public.migramap_profiles(user_id,email) values(auth.uid(),coalesce(auth.jwt()->>'email','')) on conflict(user_id) do update set email=excluded.email;
 insert into public.migramap_diaries(user_id) values(auth.uid()) on conflict(user_id) do nothing;
end; $$;
create or replace function public.migramap_save_diary(payload jsonb,expected_revision bigint) returns bigint language plpgsql security invoker set search_path='' as $$
declare result bigint;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if octet_length(payload::text)>5000000 then raise exception 'Diary exceeds 5 MB limit'; end if;
 update public.migramap_diaries set data=payload,revision=revision+1,updated_at=now() where user_id=auth.uid() and revision=expected_revision returning revision into result;
 if result is null then raise exception 'This diary changed in another session. Reload before saving.' using errcode='40001'; end if;
 return result;
end; $$;
create or replace function public.migramap_complete_onboarding() returns void language sql security invoker set search_path='' as $$
 update public.migramap_profiles set onboarding_completed_at=coalesce(onboarding_completed_at,now()) where user_id=auth.uid();
$$;
revoke all on function public.migramap_bootstrap(), public.migramap_save_diary(jsonb,bigint), public.migramap_complete_onboarding() from public;
grant execute on function public.migramap_bootstrap(), public.migramap_save_diary(jsonb,bigint), public.migramap_complete_onboarding() to authenticated;
commit;
