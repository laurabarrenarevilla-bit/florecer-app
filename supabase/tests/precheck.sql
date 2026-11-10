-- Comprobación PREVIA a aplicar 20261109000000_journal_entries.sql.
-- Solo lectura: no modifica nada. Ejecutar en el SQL Editor del proyecto de destino.
-- Resultado esperado en un proyecto nuevo: todas las consultas devuelven 0 filas
-- o "false"; si no, PARAR y revisar antes de aplicar la migración.

-- 1. ¿Existe ya la tabla? (create table if not exists la saltaría sin avisar)
select to_regclass('public.journal_entries') is not null as tabla_ya_existe;

-- 2. ¿Existe ya la función del trigger? (create or replace la sustituiría)
select proname, pg_get_function_identity_arguments(oid) as args
from pg_proc
where pronamespace = 'public'::regnamespace and proname = 'journal_entries_before_write';

-- 3. Otras tablas en public (solo nombres, para conocer el punto de partida)
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

-- 4. Número de cuentas existentes (solo el recuento, sin datos personales)
select count(*) as cuentas_auth from auth.users;
