# 05 — Datos, Supabase y seguridad PostgreSQL

## Requisitos de configuración

Supabase proyecto separado de otros productos; preferiblemente dev y producción diferentes. CLI/migraciones versionadas; no usar la interfaz SQL de producción como única fuente de verdad. URL y publishable/anon key en cliente; **service_role/secret** nunca en navegador ni en variables `VITE_`.

## Modelo inicial (SQL de referencia para convertir en migración)

```sql
-- Revisar con la versión del proyecto antes de aplicarlo.
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  mood text not null check (mood in ('happy', 'neutral', 'sad')),
  reflection text not null default '' check (char_length(reflection) <= 5000),
  achievement text not null default '' check (char_length(achievement) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journal_entries_user_date_unique unique (user_id, entry_date)
);
create index if not exists journal_entries_user_date_idx
  on public.journal_entries (user_id, entry_date desc);

create or replace function public.set_journal_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end; $$;
create trigger journal_entries_updated_at
before update on public.journal_entries
for each row execute function public.set_journal_updated_at();

alter table public.journal_entries enable row level security;
create policy "read own journal" on public.journal_entries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert own journal" on public.journal_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own journal" on public.journal_entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "delete own journal" on public.journal_entries
  for delete to authenticated using ((select auth.uid()) = user_id);
```

**Importante:** Esta SQL es una especificación de arranque, no una orden de aplicar en remoto sin revisar. El agente debe generar migración idempotente/ordenada para base limpia y tener cuidado con `create trigger` al reejecutar. Confirmar grants/permisos del esquema PostgreSQL en Supabase, y que el `upsert` del cliente tenga las políticas adecuadas. No usar `force row level security` sin evaluar el comportamiento esperado.

## Semántica y tipos

| DB | TS/domain | Regla |
|---|---|---|
| `id` | `string` UUID | lo genera DB |
| `user_id` | `string` UUID | coincide con sesión auténtica |
| `entry_date` | `LocalDate` string | `YYYY-MM-DD` fecha civil, sin zona |
| `mood` | `Mood` | `happy`, `neutral`, `sad` |
| `reflection` | `string` | opcional en formulario, `''` en DB, máx. 5000 chars |
| `achievement` | `string` | opcional en formulario, `''` en DB, máx. 500 chars |
| `created_at`,`updated_at` | ISO datetime | timestamps de auditoría, no reemplazan fecha civil |

Mapeo visual: `happy → Feliz/#F5D36A`; `neutral → Normal/#F2A66E`; `sad → Triste/#91BCE0`. **NO** guardar strings visuales en castellano: el prototipo utiliza `feliz,normal,triste` y necesita adaptación al contrato. La capa repo transforma `snake_case` a dominio camelCase y viceversa.

## Operaciones requeridas

- `listEntries({from,to})`: selección filtrada por período y orden fecha, `user_id` de sesión; la RLS sigue aplicando incluso si se manipula query.
- `getEntry(date)`: devuelve 0 o 1, no duplica.
- `saveEntry(input)`: `insert/upsert` con `(user_id, entry_date)` y validated mood/text; de ser necesario, primero leer y luego update específico con tratamiento de conflictos.
- `deleteEntry(date/id)`: solo propiedad del usuario; comprobar confirmación y resultado real.
- `listAllForExport()`: paginar para evitar truncamiento por límite API de Supabase.
- `deleteAllEntries()` (si se ofrece): procesar correctamente todas las entradas del usuario, con confirmación; no usar `service_role` ni eliminar datos de otros.

## Manejo de fechas

`new Date().toISOString().slice(0,10)` **NO se debe usar** para determinar el día local, porque cambia de día según UTC. Formatear año/mes/día con zona del dispositivo (`getFullYear/getMonth/getDate`) o una librería de fechas. `YYYY-MM-DD` siempre se trata como fecha civil. Prohibir fechas futuras en cliente (y en servicio si existe), testar límites de medianoche; en este proyecto la referencia de prueba es Europe/Madrid. No almacenar `new Date('YYYY-MM-DD')` como instante y luego reinterpretarlo sin cautela.

## Separación de responsabilidades

Supabase DB guarda las entradas, no los resúmenes calculados. No tabla `achievements` separada en fase 1 o 2: se extraen del campo `achievement`. No tablas de cuentas personalizadas si Supabase Auth es suficiente. Las estadísticas se calculan sobre filas recuperadas, no se persisten. Mantener opciones para perfiles/analyses solo con ADR futura.

## Pruebas RLS obligatorias

- Dos usuarios A y B, datos diferentes.
- A solo ve A, B solo ve B, anónimo no ve nada.
- A no puede `insert` con `user_id` de B, ni `update`/`delete` filas de B.
- Upsert con fecha igual afecta una única entrada propia.
- No usar admin/service key para probar RLS, porque podría eludirlas.
- Fallo de conexión y sesión caducada no deben mostrar un éxito ficticio.
- Verificar `pg_policies`, restricciones, indices, timestamps y grants.

## Recursos y límites

Usar índices específicos del patrón de lectura. No escalar prematuramente. Limitar longitud de los campos en UI/servicio/DB y considerar la sensibilidad de los textos en cualquier exportación. No exponer datasets en `public/`, devtools logs, mocks o capturas.
