-- Florecer · fase 2 · emociones secundarias
-- Cada entrada puede llevar hasta 3 emociones concretas, opcionales, que deben
-- pertenecer al grupo de su ánimo principal (mood). Basado en la rueda de
-- Plutchik; ver docs/decisions/ADR-011-emociones-secundarias.md.
--
-- Códigos en inglés en la base de datos; nombres en español solo en la UI
-- (mismo criterio que mood, ADR-006). Las entradas existentes quedan con '{}'.
--
-- Revisar antes de aplicar. Aplicar solo con autorización expresa.
-- Reversión: supabase/manual/rollback_20261122000000_journal_emotions.sql

-- 1. Columna ----------------------------------------------------------------
alter table public.journal_entries
  add column if not exists emotions text[] not null default '{}';

-- 2. Restricciones ----------------------------------------------------------
alter table public.journal_entries
  drop constraint if exists journal_entries_emotions_max,
  drop constraint if exists journal_entries_emotions_no_nulls,
  drop constraint if exists journal_entries_emotions_match_mood;

alter table public.journal_entries
  add constraint journal_entries_emotions_max
    check (cardinality(emotions) <= 3),
  add constraint journal_entries_emotions_no_nulls
    check (array_position(emotions, null) is null),
  -- Si cambia el ánimo, las emociones deben cambiar con él: la base de datos
  -- nunca acepta "tristeza + optimismo".
  add constraint journal_entries_emotions_match_mood
    check (
      emotions <@ case mood
        when 'happy' then array['serenity', 'optimism', 'love', 'trust', 'interest', 'admiration']
        when 'neutral' then array['acceptance', 'anticipation', 'surprise', 'distraction', 'boredom']
        when 'sad' then array['melancholy', 'disappointment', 'remorse', 'fear', 'anger', 'disgust']
      end::text[]
    );

-- 3. Trigger: además de lo anterior, rechaza emociones repetidas -------------
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

  if new.emotions is not null
    and pg_catalog.cardinality(new.emotions) <> (
      select pg_catalog.count(distinct e) from pg_catalog.unnest(new.emotions) as e
    ) then
    raise exception 'emotions no puede contener emociones repetidas'
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

revoke all on function public.journal_entries_before_write() from public, anon, authenticated;

-- 4. Privilegios por columna ------------------------------------------------
grant insert (emotions) on table public.journal_entries to authenticated;
grant update (emotions) on table public.journal_entries to authenticated;
