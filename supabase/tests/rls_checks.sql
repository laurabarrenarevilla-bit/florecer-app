-- Comprobaciones de solo lectura tras aplicar la migración.
-- Ejecutar en el SQL Editor del proyecto. No modifican nada.

-- RLS activada en la tabla
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where oid = 'public.journal_entries'::regclass;

-- Políticas existentes (deben ser 4, todas "to authenticated" con auth.uid())
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'journal_entries'
order by policyname;

-- Privilegios de tabla (anon no debe tener ninguno)
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'journal_entries'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

-- Privilegios por columna de authenticated (insert/update limitados)
select grantee, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'journal_entries'
  and grantee = 'authenticated' and privilege_type in ('INSERT', 'UPDATE')
order by privilege_type, column_name;

-- Restricciones
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.journal_entries'::regclass
order by conname;

-- Trigger
select tgname, pg_get_triggerdef(oid)
from pg_trigger
where tgrelid = 'public.journal_entries'::regclass and not tgisinternal;
