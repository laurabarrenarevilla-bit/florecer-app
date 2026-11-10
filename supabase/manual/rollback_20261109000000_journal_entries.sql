-- VUELTA ATRÁS de 20261109000000_journal_entries.sql  ·  OPERACIÓN DESTRUCTIVA
--
-- Elimina la tabla journal_entries, su trigger, sus políticas y su función.
-- Solo para deshacer una aplicación fallida ANTES de que haya datos reales.
-- Requiere autorización expresa de la propietaria del proyecto.
-- Salvaguarda: aborta sin tocar nada si la tabla contiene alguna fila.

begin;

do $$
begin
  if to_regclass('public.journal_entries') is not null
     and exists (select 1 from public.journal_entries) then
    raise exception 'journal_entries contiene filas: vuelta atrás cancelada. Exportar y revisar antes.';
  end if;
end;
$$;

drop table if exists public.journal_entries;           -- arrastra trigger y políticas
drop function if exists public.journal_entries_before_write();

commit;
