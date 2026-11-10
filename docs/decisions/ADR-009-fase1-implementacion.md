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

## 9. Sesión caducada y borradores (bloque 6)

- Si el backend rechaza el token (`AUTH_REQUIRED`), las cachés de React Query lo notifican, `AuthProvider` cierra la sesión **solo localmente** (`signOut({ scope: 'local' })`) y se redirige a `/login` con «Tu sesión ha terminado». Nunca se muestra un guardado falso.
- Lo escrito y aún no guardado se conserva en un `Map` **en memoria** (`features/journal/draftStore.ts`), por usuario y fecha. Al volver a entrar en la misma pestaña, el formulario lo recupera y lo indica. No se usa `localStorage` ni `sessionStorage`: al recargar, cerrar la pestaña o cerrar sesión, desaparece. Al entrar otra cuenta se descartan los borradores ajenos.

## 10. Carga diferida y chunks

Las pantallas se cargan con `React.lazy` y las librerías se separan en chunks `react`, `supabase` y `vendor` (`build.rolldownOptions.output.codeSplitting`). Desaparece el aviso de chunk > 500 kB sin añadir dependencias.

## 11. Cabeceras de Vercel y CSP

`vercel.json` define el rewrite SPA (excepto `/api/`), una CSP estricta (`script-src 'self'`, `connect-src` limitado a `*.supabase.co`, `frame-ancestors 'none'`) y cabeceras `nosniff`, `Referrer-Policy`, `X-Frame-Options` y `Permissions-Policy`. Zod se configura en modo `jitless` (`src/lib/zodConfig.ts`) para no usar `new Function`, que la CSP bloquearía. Una prueba E2E local aplica la CSP del archivo al build y falla ante cualquier violación.

## 12. Pruebas locales frente a pruebas remotas

- `pnpm test` y `pnpm e2e` no contactan con Supabase (repositorios en memoria; peticiones externas bloqueadas en Playwright).
- `pnpm test:rls` y `pnpm e2e:remote` solo se ejecutan con `FLORECER_REMOTE_TESTS=1` (lo ponen los scripts). Sin esa variable las suites se omiten sin leer credenciales. Exigen cuentas sintéticas (correo con «test») y distintas, usan solo la clave publicable y borran únicamente filas propias en fechas concretas.
- Las cuentas A/B se crean una sola vez por el registro público de la UI (`remote/accounts.setup.ts`); las ejecuciones siguientes solo inician sesión.
- Sin trazas de Playwright: guardarían tokens y textos de las peticiones.

## 13. Confirmación de correo activa en el proyecto (actualiza §1)

El 10-11-2026 se observó que el proyecto tiene **«Confirm email» activado**: `signUp` no devuelve sesión y Supabase envía su correo de confirmación con el servicio de correo integrado (sigue sin haber SMTP externo). A petición del usuario, la interfaz se adapta:

- Tras registrarse sin sesión, el formulario y las pestañas se sustituyen por «Revisa tu correo», con la dirección usada y el botón «Ir a iniciar sesión». Este aviso solo aparece cuando `signUp` termina sin error y sin sesión, es decir, cuando Supabase ha aceptado el registro y ha enviado el correo.
- Con la confirmación activa, Supabase no da error si el correo ya está registrado (devuelve un usuario sin identidades y no envía nada). La app lo detecta y muestra «Ya existe una cuenta…», en lugar de pedir que se revise un correo que no llegará.
- Iniciar sesión sin haber confirmado muestra un mensaje específico (`email_not_confirmed`). El límite de envíos (`over_email_send_rate_limit`) tiene también su propio mensaje.
- Si la confirmación se desactiva, `signUp` devuelve sesión y se entra directamente en Hoy: la app funciona en los dos modos sin cambios.

**Riesgo pendiente de decidir:** el servicio de correo integrado de Supabase solo entrega a direcciones del equipo de la organización y con un límite muy bajo de envíos por hora. Para cualquier otra persona, el correo de confirmación puede no llegar nunca y la cuenta quedaría sin poder entrar. También hay que revisar la *Site URL*, porque el enlace del correo redirige allí tras confirmar. Mientras no haya SMTP propio (descartado en §1), lo coherente para un registro abierto es desactivar «Confirm email»; mantenerla activada solo funciona para cuentas del equipo.

**Resolución (10-11-2026):** con autorización del usuario se desactivó «Confirm email» en el proyecto. El registro vuelve a dar sesión inmediata y entra en Hoy. La pantalla «Revisa tu correo» solo aparecería si alguien reactivara la confirmación.

## 14. Eliminación de la propia cuenta

- Ajustes → «Eliminar cuenta»: diálogo de confirmación que vuelve a pedir la contraseña (se comprueba con `signInWithPassword` antes de borrar). El botón «Cancelar» tiene el foco por defecto.
- Sin backend ni `service_role` en el navegador: función SQL `public.delete_my_account()` (`20261110000000`), `SECURITY DEFINER` y `search_path` vacío. No recibe parámetros: borra las entradas de `auth.uid()` y su fila de `auth.users`, y Supabase borra en cascada sesiones, identidades y tokens. Solo `authenticated` puede ejecutarla.
- Tras el borrado se cierra la sesión local y `/login` confirma «Tu cuenta y todos tus registros se han eliminado.». Se limpian la caché y los borradores en memoria.
- El token de acceso ya emitido sigue siendo válido hasta que caduca (los JWT no se revocan), pero ya no hay datos que leer ni cuenta que refrescar.
- Si la función no existe en el proyecto, la app lo dice y no borra nada.

