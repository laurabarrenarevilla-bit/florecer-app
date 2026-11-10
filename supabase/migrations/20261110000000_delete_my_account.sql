-- Florecer · fase 1 · eliminación de la propia cuenta
-- Permite a una persona con sesión borrar SU cuenta (auth.users) y todos sus
-- datos (journal_entries), sin exponer service_role al navegador.
--
-- Revisar antes de aplicar. Aplicar solo con autorización expresa.

create or replace function public.delete_my_account()
returns void
language plpgsql
-- Necesario para borrar en auth.users. El alcance queda limitado a auth.uid():
-- nunca recibe parámetros, así que no puede apuntar a otra cuenta.
security definer
set search_path = ''
as $$
declare
  current_uid uuid := auth.uid();
begin
  if current_uid is null then
    raise exception 'Se requiere una sesión para eliminar la cuenta'
      using errcode = 'insufficient_privilege';
  end if;

  -- Datos del diario (también los borraría el ON DELETE CASCADE; se hace
  -- explícito para que el borrado no dependa solo de la clave foránea).
  delete from public.journal_entries where user_id = current_uid;

  -- La cuenta. Supabase borra en cascada sus sesiones, identidades y tokens.
  delete from auth.users where id = current_uid;
end;
$$;

comment on function public.delete_my_account() is
  'Elimina la cuenta de quien la llama (auth.uid()) y todas sus entradas del diario. Irreversible.';

-- Solo usuarios con sesión pueden ejecutarla; nunca anon ni public.
revoke all on function public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;
