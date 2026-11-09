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

URL del sitio y redirects correctos para local y producción. Según ADR-009: signup público ON, *Confirm email* OFF, política de contraseñas (mín. 8, mayúsculas, minúsculas y dígitos), rate limits revisados, CAPTCHA nativo disponible si hay abuso. Sin SMTP externo ni recuperación por correo. Las URLs no deben permitir open redirect. Consistencia con dominio Vercel.

## Despliegue frontend Vite en Vercel

Build `pnpm build`; output habitual `dist` tras confirmar config. SPA fallback para rutas protegidas React Router (rewrite a `index.html` cuando proceda, sin tragarse endpoints `/api/`). En fase 2 verificar que Vercel Functions se reconocen en deploy. El agente debe comprobar documentación/config del framework **vigente** y evitar plantillas obsoletas.

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
