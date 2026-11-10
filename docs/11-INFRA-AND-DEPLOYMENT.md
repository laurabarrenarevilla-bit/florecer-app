# 11 — Infraestructura, entornos, despliegue y CI

## Infraestructura

- SPA estática Vite/React desplegada en Vercel.
- Supabase proyecto(s) con Postgres/Auth y RLS (datos persistentes, fuera de memoria navegador).
- Fase 2: Vercel Node Functions en `api/` con secretos de NVIDIA server-side.
- DNS/dominio personalizado opcional. HTTPS siempre.

## Entornos

| Entorno | Base de datos | IA | Uso |
|---|---|---|---|
| local | Supabase local o dev aislado | mock (fase 2) | desarrollo/tests |
| preview | dev/staging aislado | mock o clave dev limitada | QA en PR |
| production | proyecto Supabase producción | clave NVIDIA production server-only | usuaria real |

Nunca conectar previews públicas al proyecto de datos personales reales por comodidad. Si solo hay un Supabase al principio, impedir fixtures automáticos y etiquetar limitación hasta poder aislar entornos.

## Variables de entorno

Ver `.env.example` del paquete. `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (o anon key de legado) accesibles al browser; **no secret**. `NVIDIA_API_KEY`, `NVIDIA_MODEL` y `NVIDIA_API_BASE_URL` solo backend fase 2. Configurar de nuevo en Vercel para el environment correcto. No confiar en `.env.example` como configuración activa.

## Configuración Supabase Auth

URL del sitio y redirects correctos para local y producción. Según ADR-009: signup público ON, *Confirm email* OFF (aplicado el 10-11-2026; ver ADR-009 §13), política de contraseñas (mín. 8, mayúsculas, minúsculas y dígitos), rate limits revisados, CAPTCHA nativo disponible si hay abuso. Sin SMTP externo ni recuperación por correo. Las URLs no deben permitir open redirect. Consistencia con dominio Vercel.

## Despliegue frontend Vite en Vercel

Build `pnpm build`; output habitual `dist` tras confirmar config. SPA fallback para rutas protegidas React Router (rewrite a `index.html` cuando proceda, sin tragarse endpoints `/api/`). En fase 2 verificar que Vercel Functions se reconocen en deploy. El agente debe comprobar documentación/config del framework **vigente** y evitar plantillas obsoletas.

## Vercel: configuración preparada (sin desplegar)

`vercel.json`: framework Vite, `pnpm install --frozen-lockfile`, `pnpm build`, salida `dist`, rewrite SPA a `index.html` excepto `/api/`, CSP y cabeceras de seguridad, y caché inmutable para `/assets/`. Pasos pendientes de autorización:

1. Importar el repositorio en la cuenta de Vercel de Laura (rama `main`).
2. Variables de entorno **Production**: `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Nada más: ni secretos ni `NVIDIA_*` en fase 1.
3. No conectar las previews al proyecto Supabase con datos reales (no definir esas variables en Preview).
4. Tras el primer despliegue: Supabase → Authentication → URL Configuration → *Site URL* = URL de producción; *Redirect URLs* = esa URL y `http://localhost:5173/**`.
5. Smoke: deep link a `/calendario?mes=…`, recarga en `/hoy`, guion de 90 s de `docs/03`.

## PWA: configuración local preparada (10-11-2026)

Ver `decisions/ADR-010-pwa-instalable.md`. El build genera `sw.js` y Workbox;
el manifest sigue en `/favicon/site.webmanifest`. Registro solo en build de
producción, con actualizaciones solicitadas por la persona. La caché contiene
solo archivos públicos; Supabase y las API siguen requiriendo conexión.
`vercel.json` añade revalidación del worker/script de ciclo de vida/manifest,
tipo MIME del manifest, `worker-src 'self'` y exclusiones del rewrite SPA.
Verificar estos cambios en HTTPS tras autorización de despliegue. Instalación
real Android/iOS y retirada de worker aún pendientes de ensayo en dispositivos.

## CI mínima

Pull request: instalación lockfile `pnpm install --frozen-lockfile`; `typecheck`, `lint`, `test`, `build`; Playwright según recursos; escaneo básico de secretos/dependencias. Tests contra Supabase de prueba y sin archivos personales. Gate verde antes de deploy final.

## Configuración operativa

- Migraciones versionadas en `supabase/migrations/`; aplicar con revisión y entorno correcto.
- Guardar IDs/nombres del proyecto en documentación privada local, no secretos en README.
- Controlar logs, retention y accesos de Vercel/Supabase y terceros.
- Comprobar límites gratuitos, cuotas de DB y proveedor IA antes de activar fase 2.
- No prometer funcionamiento offline por estar desplegado como PWA.

## Checklist de lanzamiento

1. URL HTTPS y navegación deep links correcta.
2. Proyecto DB correcto con migraciones, RLS y cuenta real autorizada.
3. Env keys revisadas y protegidas según frontend/backend.
4. Login y operaciones CRUD funcionan desde móvil real.
5. Recarga conserva datos; no seed sintético en prod.
6. 2 usuarios test de aislamiento RLS.
7. Error de red no informa éxito falso.
8. Fase 2: consentimientos, controles IA, copia de seguridad probada.
9. Registrar versión/commit, evidencias y plan de rollback.
