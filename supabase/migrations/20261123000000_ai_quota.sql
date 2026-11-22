-- Florecer · fase 2 · cuota persistente del análisis con IA
-- docs/08 exige un límite por persona guardado fuera de la función serverless
-- antes de abrir el endpoint a cualquier cuenta (el registro es público).
-- Límites: 1 petición por minuto y 10 por día (24 h móviles).
--
-- La tabla solo guarda quién y cuándo: nunca textos, prompts ni resultados.
-- Nadie la lee ni escribe directamente; solo la función consume_ai_quota().
--
-- Revisar antes de aplicar. Aplicar solo con autorización expresa.
-- Reversión: supabase/manual/rollback_20261123000000_ai_quota.sql

create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.ai_usage is
  'Marcas de uso del análisis con IA para la cuota por persona. Sin contenido.';

create index if not exists ai_usage_user_created_idx on public.ai_usage (user_id, created_at desc);

-- RLS activada y sin políticas: ningún rol de la API accede a las filas.
alter table public.ai_usage enable row level security;
revoke all on table public.ai_usage from anon, authenticated;

create or replace function public.consume_ai_quota()
returns void
language plpgsql
-- Necesario para escribir en ai_usage, que no tiene políticas. Sin parámetros:
-- solo puede afectar a la cuota de quien llama (auth.uid()).
security definer
set search_path = ''
as $$
declare
  current_uid uuid := auth.uid();
begin
  if current_uid is null then
    raise exception 'Se requiere una sesión' using errcode = 'insufficient_privilege';
  end if;

  -- Serializa peticiones simultáneas de la misma persona (doble clic, pestañas).
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(current_uid::text, 0));

  if exists (
    select 1 from public.ai_usage
    where user_id = current_uid and created_at > pg_catalog.now() - interval '1 minute'
  ) then
    raise exception 'AI_RATE_LIMIT_MINUTE' using errcode = 'P0001';
  end if;

  if (
    select pg_catalog.count(*) from public.ai_usage
    where user_id = current_uid and created_at > pg_catalog.now() - interval '1 day'
  ) >= 10 then
    raise exception 'AI_RATE_LIMIT_DAY' using errcode = 'P0001';
  end if;

  insert into public.ai_usage (user_id) values (current_uid);

  -- Limpieza: no se conserva más historial del necesario para la cuota.
  delete from public.ai_usage
  where user_id = current_uid and created_at < pg_catalog.now() - interval '2 days';
end;
$$;

revoke all on function public.consume_ai_quota() from public, anon, authenticated;
grant execute on function public.consume_ai_quota() to authenticated;
