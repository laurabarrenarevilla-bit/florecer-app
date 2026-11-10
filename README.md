# Florecer

Diario emocional personal en español de España. Cada día se registra cómo te has sentido (Feliz, Normal o Triste), con una reflexión y un pequeño logro opcionales, y se consulta en un calendario de colores.

**Estado (10-11-2026):** fase 1 implementada y verificada contra Supabase real: migración aplicada, RLS con dos cuentas y E2E remotas en verde (ver `docs/10-TEST-PLAN.md`, «Estado de verificación»). **Pendiente: despliegue en Vercel** y smoke en un móvil real.

## Stack

React 19 + Vite 8 + TypeScript (strict) · React Router · TanStack Query · Supabase (Auth + PostgreSQL con RLS) · Zod · SASS 7-1 en `src/sass/` · Vitest + Testing Library · Playwright + axe-core · Vercel.

## Puesta en marcha local

```bash
pnpm install
cp .env.example .env.local   # rellenar SOLO VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY
pnpm dev
```

En el navegador solo se publica la clave **publicable** de Supabase. Nunca `service_role` ni secretos (`env.ts` rechaza claves `sb_secret_`).

## Scripts

| Script | Qué hace | ¿Toca Supabase? |
|---|---|---|
| `pnpm typecheck` / `lint` / `build` | Tipos, oxlint y build de producción | No |
| `pnpm test` | Unitarias y de integración (jsdom, repositorios en memoria, axe-core) | No |
| `pnpm e2e` | Navegador real contra el build: rutas públicas, validación, accesibilidad con contraste, CSP de `vercel.json`, secretos en el bundle. Bloquea cualquier petición externa | No |
| `pnpm test:rls` | Aislamiento RLS con dos cuentas (A/B) y la clave publicable | **Sí** (con autorización) |
| `pnpm e2e:remote` | Flujos completos de la fase 1 en el navegador contra el proyecto real | **Sí** (con autorización) |

Las pruebas remotas necesitan `.env.test.local` (ignorado por git) con `TEST_A_EMAIL`, `TEST_A_PASSWORD`, `TEST_B_EMAIL` y `TEST_B_PASSWORD`. Son cuentas sintéticas: el correo debe contener «test». Se registran una sola vez por el registro público y después solo inician sesión. Solo borran sus propias filas en fechas concretas; nunca hacen limpiezas globales.

## Estructura

```
src/app/          composición: rutas, proveedores, React Query, ErrorBoundary
src/features/     auth, journal (Hoy), calendar, settings
src/shared/       utilidades puras (fechas, errores) y componentes de UI
src/lib/supabase/ cliente y validación del entorno
src/sass/         estilos (7-1): abstracts, base, components, layout, pages, themes
supabase/         migraciones, comprobaciones SQL y vuelta atrás manual
tests/rls/        aislamiento RLS (remoto)
tests/e2e/        Playwright: local/ (sin red) y remote/ (Supabase real)
docs/             especificación, decisiones (ADR) y procedimientos
```

## Seguridad y privacidad

- RLS por `auth.uid()` y privilegios por columna; el cliente nunca envía `user_id`.
- Registro público con correo y contraseña, solo con Supabase Auth y sin SMTP externo. Si el proyecto exige confirmar el correo, la app pide revisarlo tras el registro; si no, entra directamente. No hay recuperación de contraseña por correo (ADR-009 §1 y §13).
- Cada persona puede eliminar su cuenta y todos sus registros desde Ajustes, confirmando con su contraseña (función SQL `delete_my_account`, limitada a `auth.uid()`).
- Los borradores sin guardar se conservan solo en memoria de la pestaña, nunca en `localStorage`.
- CSP estricta y cabeceras de seguridad en `vercel.json`.

## Documentación

Empieza por `CLAUDE.md` (= `AGENTS.md`) y `docs/INDEX.md`. Decisiones de esta implementación: `docs/decisions/ADR-009-fase1-implementacion.md`. Migración y recuperación: `docs/18-OPERATIONS-AND-RECOVERY.md`.
