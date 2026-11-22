-- VUELTA ATRÁS de 20261122000000_journal_emotions.sql  ·  OPERACIÓN DESTRUCTIVA
--
-- Elimina la columna emotions y sus restricciones, y restaura el trigger de la
-- fase 1. Las entradas, su ánimo, reflexión y logro se conservan.
-- Requiere autorización expresa de la propietaria del proyecto.
-- Salvaguarda: aborta sin tocar nada si alguna entrada tiene emociones guardadas
-- (se perderían). Exportar y revisar antes.

begin;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'journal_entries' and column_name = 'emotions'
  ) and exists (select 1 from public.journal_entries where cardinality(emotions) > 0) then
    raise exception 'Hay entradas con emociones guardadas: vuelta atrás cancelada. Exportar y revisar antes.';
  end if;
end;
$$;

alter table public.journal_entries drop column if exists emotions;  -- arrastra sus restricciones

create or replace function public.journal_entries_before_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
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

revoke all on function public.journal_entries_before_write() from public, anon, authenticated;

commit;
