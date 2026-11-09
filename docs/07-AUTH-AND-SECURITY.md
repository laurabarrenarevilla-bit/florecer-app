# 07 — Autenticación, privacidad y modelo de amenazas

## Auth

Supabase Auth nativo, email/password. **Registro público** con confirmación de email desactivada (ADR-009): las cuentas **no verifican la propiedad de su dirección de correo**. Sin proveedor SMTP externo en ninguna fase. Sin recuperación de contraseña por correo mientras el correo integrado de Supabase no pueda enviarla a los usuarios correspondientes; no crear botón falso. Configurar redirect URLs exactas de local, preview autorizadas y producción; no aceptar URLs de redirección arbitrarias. Estado de sesión cargando antes de renderizar rutas privadas; redirect a login al caducar.

## RLS y control de acceso

El cliente puede consultar Supabase directamente porque Postgres aplica políticas por `auth.uid()`. Esta es la barrera efectiva, **no** esconder controles ni filtrar en frontend. No introducir claves privilegiadas en cliente. La API de IA verifica autenticación servidor-side mediante Supabase Auth antes de cualquier operación; la sesión enviada a endpoint debe protegerse y nunca registrarse.

## Amenazas y mitigaciones

| Riesgo | Mitigación y comprobación |
|---|---|
| Acceso entre cuentas | RLS en todas las tablas y tests A/B autenticados |
| Robo de clave NVIDIA | variable backend sin `VITE_`, nunca importada al cliente |
| Reflexiones en logs | redacción y exclusión en backend, consola, errores y plataformas |
| Envío accidental a tercero | preview íntegra, selección y consentimiento explícitos |
| Pérdida de datos | export JSON + pruebas restauración; persistencia real en Supabase |
| Importación maliciosa | validación Zod, tamaño límite, no evaluación, no HTML crudo |
| XSS desde reflexión | escapar por React; NO `dangerouslySetInnerHTML`; no renderizar Markdown HTML arbitrario |
| Sesión caducada | 401/redirect, conservar borrador mientras sea viable |
| Enumeración de cuentas | mensajes de auth prudentes y limitación de intentos del proveedor |
| Flood/coste IA | cuotas, validación de ids/longitud, timeout, respuesta validada |
| Borrado masivo | confirmación reforzada, limitar a usuario actual, informe final de operación |

## Principios de privacidad

- Registros en Supabase: no afirmar "solo en este dispositivo".
- La infraestructura/proveedor puede procesar datos según configuración y condiciones contractuales; no afirmar privacidad absoluta.
- No usar analytics que capturen texto de reflexiones; evitar grabación de sesiones.
- Con NVIDIA: el proveedor externo recibe únicamente texto seleccionado tras consentimiento. La política pública debe reflejar ese hecho, así como usos/retención realmente comprobados en la plataforma.
- No cachear contenido sensible permanentemente en almacenamiento inseguro del navegador ni adjuntarlo a URLs.
- No usar datos reales en tests, herramientas de terceros, pantallas demo ni logs.
- Para presentación al profesor, usar cuenta demo sintética o mostrar datos agregados si las reflexiones personales pudieran divulgarse.

## IA y salud mental

No etiquetar enfermedades, suicidabilidad, rasgos clínicos ni diagnósticos a partir de textos. No presentar inferencias como hechos. Mensajes orientativos y preguntas abiertas, sin sustitución de ayuda profesional. Si un proveedor devuelve contenido problemático, mostrar error/aviso neutral, no una interpretación clínica definitiva.

## Checklist de seguridad predespliegue

1. `.env` y credenciales ausentes del commit y del bundle generado.
2. Políticas RLS y 2 cuentas testadas.
3. HTTPS, supabase redirect allowlist y CORS same-origin API.
4. Inputs validados, respuestas IA saneadas como texto.
5. Errores sin contenido de usuario; no debugging de producción con payloads reales.
6. Acciones destructivas con confirmación y nombre exacto del ámbito.
7. Privacidad y copias coherentes con comportamiento efectivo.
8. Limitar secretos a plataforma server-side y revisar los permisos de acceso a entornos.
