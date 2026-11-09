# 18 — Operación, incidencias y recuperación

## Operación cotidiana

La usuaria debe tener una URL estable que funcione desde móvil. La configuración de Supabase Auth/URLs debe coincidir con el deployment. En ningún caso se usa el prototipo de Claude Design para registrar contenido real.

## Incidente: no guarda entrada

1. Confirmar si petición se realizó, su HTTP/error code y estado Auth, sin imprimir contenido de reflexión.
2. Comprobar conectividad, URL y clave publishable Supabase, usuario real, políticas RLS y constraint única.
3. Conservar texto en formulario mientras hay error. Reintentar con control de duplicados.
4. Verificar luego en DB del usuario y tras recarga. No anunciar éxito por un toast local.
5. Si requiere migraciones/cambios de DB remotos, pedir autorización y hacer backup/plan rollback.

## Incidente: sesión rota

Revisar email verificado, URLs redirect, recuperación, caducidad token, conexión y estado del cliente; no registrar JWT. No habilitar auth bypass como solución.

## Incidente: calendario cambia fecha

Reproducir con timezone del dispositivo, febrero/noviembre, cambios de DST; revisar `YYYY-MM-DD` y conversiones ISO/UTC. Nunca modificar fechas históricas masivamente sin migración/revisión y copia.

## Incidente: API NVIDIA no responde

Revisar estado proveedor, modelo configurado, cuota y respuesta HTTP, sin loguear prompt; mostrar alternativa Copiar para ChatGPT sin envío. No comprometer diario. Aplicar timeout/circuit-breaker simple si conviene; deshabilitar temporalmente IA si inestable.

## Incidente: datos faltantes o corrupción

No sobrescribir. Verificar filtros de rango, paginación, sesión/usuario y datos reales. Identificar copia JSON disponible, validar/ensayar recuperación en dev antes de producción. No ejecutar restores ni destrucciones a recursos reales sin consentimiento expreso.

## Rollback

- App: redeploy de una versión verificada Vercel.
- DB: migraciones forward compatibles y backups/recuperación ensayados. Rollback de base de datos no es automáticamente inverso al código.
- Cambios de schema: migración planificada, pruebas en staging, conservación de datos, revisión RLS.

## Observabilidad mínima

Logs estructurados solo para estados/códigos/duración y request id no sensible. No guardar reflexión, payload IA, backup, email, JWT ni claves. Monitorización de fallos de guardado y de la función IA sin hacer session replay.

## Soporte y confidencialidad

La app maneja reflexiones personales. No pedir capturas que revelen diarios por defecto. Usar pruebas sintéticas y logs redactados. Mantener política clara de qué datos están en nube y cuándo se comparten para IA.
