-- Florecer · fase 1 · diario emocional
-- Tabla journal_entries con RLS por auth.uid(), privilegios por columna y
-- control de fechas futuras. Ver docs/05 y docs/decisions/ADR-009.
--
-- Revisar antes de aplicar. Aplicar solo con autorización expresa de la
-- propietaria del proyecto (supabase db push o SQL Editor con este archivo).

-- 1. Tabla -------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  -- El cliente nunca envía user_id: lo fija la sesión y lo comprueba la RLS.
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date date not null,
  mood text not null,
  reflection text not null default '',
  achievement text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journal_entries_user_date_unique unique (user_id, entry_date),
  constraint journal_entries_mood_check check (mood in ('happy', 'neutral', 'sad')),
  constraint journal_entries_reflection_length check (char_length(reflection) <= 5000),
  constraint journal_entries_achievement_length check (char_length(achievement) <= 500),
  constraint journal_entries_date_min check (entry_date >= date '2000-01-01')
);

comment on table public.journal_entries is
  'Una entrada de diario por usuario y fecha civil local (YYYY-MM-DD).';

-- El índice único (user_id, entry_date) cubre las lecturas por rango de fechas.

-- 2. Trigger: timestamps, inmutabilidad y fecha no futura --------------------
create or replace function public.journal_entries_before_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Defensa independiente de la zona del navegador: ninguna zona horaria del
  -- mundo va por delante de Pacific/Kiritimati (UTC+14). El cliente aplica el
  -- límite exacto con la fecha local de la persona.
  if new.entry_date > (pg_catalog.now() at time zone 'Pacific/Kiritimati')::date then
    raise exception 'entry_date no puede ser una fecha futura'
      using errcode = 'check_violation';
  end if;

  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.user_id := old.user_id;
    new.entry_date := old.entry_date;
    new.created_at := old.created_at;
    new.updated_at := pg_catalog.now();
  else
    new.created_at := pg_catalog.now();
    new.updated_at := new.created_at;
  end if;

  return new;
end;
$$;

drop trigger if exists journal_entries_before_write on public.journal_entries;
create trigger journal_entries_before_write
before insert or update on public.journal_entries
for each row execute function public.journal_entries_before_write();

-- 3. Row Level Security ------------------------------------------------------
alter table public.journal_entries enable row level security;

drop policy if exists "journal_entries_select_own" on public.journal_entries;
create policy "journal_entries_select_own" on public.journal_entries
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "journal_entries_insert_own" on public.journal_entries;
create policy "journal_entries_insert_own" on public.journal_entries
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "journal_entries_update_own" on public.journal_entries;
create policy "journal_entries_update_own" on public.journal_entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "journal_entries_delete_own" on public.journal_entries;
create policy "journal_entries_delete_own" on public.journal_entries
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 4. Privilegios mínimos -----------------------------------------------------
-- Supabase concede por defecto todos los privilegios a anon y authenticated.
-- Se retiran y se concede solo lo imprescindible, columna a columna.
revoke all on table public.journal_entries from anon, authenticated;

grant select, delete on table public.journal_entries to authenticated;
grant insert (entry_date, mood, reflection, achievement)
  on table public.journal_entries to authenticated;
grant update (mood, reflection, achievement)
  on table public.journal_entries to authenticated;

revoke all on function public.journal_entries_before_write() from public, anon, authenticated;
