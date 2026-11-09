# ADR-009 — Decisiones de implementación de la fase 1

- **Fecha:** 09-11-2026
- **Estado:** aceptada
- **Fase:** 1 (se mantiene en fase 2 salvo que se indique)

## 1. Registro público sin confirmación de email (sustituye a ADR-008)

**Decisión.** Cualquier persona puede crear su cuenta desde `/registro` con correo y contraseña. En Supabase Auth: *Allow new users to sign up* = ON y *Confirm email* = OFF. Solo se usa Supabase Auth nativo: **no se integra ningún proveedor SMTP externo ni dependencias de correo, en ninguna fase**. No hay recuperación de contraseña por correo mientras el correo integrado de Supabase no pueda enviarla a los usuarios correspondientes (en el plan Free solo entrega a miembros del equipo de la organización y con límites muy bajos). No se crean usuarios desde el panel.

**Consecuencia explícita: las cuentas registradas NO verifican la propiedad de su dirección de correo.** El correo es solo un identificador de acceso.

**Motivo.** Proyecto de clase sobre el plan gratuito; el registro debe funcionar sin intervención del desarrollador ni servicios externos.

**Riesgos y mitigaciones.**

| Riesgo | Mitigación |
|---|---|
| Cuentas con correos ajenos o falsos | RLS por `auth.uid()`: cada cuenta solo ve sus datos; la app no envía correos a esa dirección |
| Alguien registra el correo de otra persona antes que ella | La usuaria principal se registra cuanto antes; riesgo aceptado |
| Altas masivas o bots | Rate limits de Supabase Auth revisados; CAPTCHA (hCaptcha/Turnstile, nativo de Supabase) disponible para activar si hay abuso |
| Enumeración de cuentas en el registro | Aceptado para dar un mensaje útil ("ya existe una cuenta"); el login usa mensaje genérico |
| Contraseña olvidada | Aviso en el registro; soporte manual excepcional de la propietaria desde el panel, previa petición y autorización |
| Contraseñas débiles | Política mínima en Supabase y la misma regla en Zod (8–72 caracteres, mayúsculas, minúsculas y dígitos) |

**Prohibido:** confirmaciones simuladas o mensajes de "te hemos enviado un correo".

## 2. Escritura de entradas: insert + update con control de concurrencia

En lugar de `upsert`, crear usa `insert` (un duplicado devuelve `23505` → `ENTRY_CONFLICT`) y editar usa `update` filtrando por `updated_at` conocido (0 filas → `ENTRY_CONFLICT`). Evita sobrescrituras silenciosas entre pestañas (`02`, `17`).

## 3. `user_id` nunca lo envía el cliente

`user_id default auth.uid()`, RLS `with check`, y privilegios por columna: `insert (entry_date, mood, reflection, achievement)` y `update (mood, reflection, achievement)` para `authenticated`; nada para `anon`.

## 4. Fecha futura

El cliente bloquea fechas posteriores a hoy (fecha local). La base de datos rechaza `entry_date` posterior a la fecha actual en `Pacific/Kiritimati` (UTC+14), defensa independiente de la zona del navegador.

## 5. Un solo proyecto Supabase

Por decisión del usuario se usa un único proyecto (propiedad de Laura). Las cuentas de prueba se registran por la UI pública, sin seeds automáticos; las pruebas limpian sus propias filas. Las previews de Vercel no se conectan a este proyecto.

## 6. Dependencias y herramientas

- `react-router` 8 (API declarativa), `@tanstack/react-query` 5, `@supabase/supabase-js` 2, `zod` 4.
- Fuentes DM Sans y Fraunces auto‑alojadas con `@fontsource-variable/*` (sin peticiones a Google Fonts).
- Sin `date-fns` ni librería de iconos: utilidades de fecha propias testadas e iconos SVG del diseño.
- Se mantiene `oxlint` (ya existente) en lugar de eslint/prettier.
- TypeScript 7.0 (compilador nativo) con `strict` y `noUncheckedIndexedAccess`.

## 7. SASS

Se respeta `src/sass/` (7-1). Los alias `@abstracts/…` que ya usaba `main.scss` se definen en `vite.config.ts`. El entrypoint `main.scss` se importa una sola vez en `src/main.tsx`.

## 8. Alcance visible en fase 1

Navegación con Hoy, Calendario y Ajustes. Evolución, IA, copias y estadísticas no se muestran hasta la fase 2. Ajustes solo muestra cuenta, cierre de sesión y privacidad.
