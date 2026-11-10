# 10 — Estrategia de pruebas y matriz de aceptación

## Principio

No aceptar "pasa" sin ejecución verificable. Pruebas unitarias de dominio, integración de componentes y servicios, pruebas SQL/RLS con dos usuarios, E2E en navegador local y smoke en despliegue. Usar fixtures sintéticos (nunca entradas reales de Laura).

## Comandos objetivo (adaptar a scripts existentes)

`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm exec playwright test` y SQL policies tests. Documentar resultados y entorno; no ejecutar contra producción por defecto.

## Fase 1 — obligatorio

| ID | Flujo / riesgo | Esperado |
|---|---|---|
| F1-01 | Formulario sin emoción | Deshabilita guardar y no inserta |
| F1-02 | Emoción sola | Registro válido, texto/logro opcionales vacíos |
| F1-03 | Guardar hoy | Confirmación real y fila única |
| F1-04 | Recarga / cerrar navegador | Se recupera fila desde Supabase |
| F1-05 | Editar día | No duplica; cambios sobreviven recarga |
| F1-06 | Crear ayer | Funciona desde calendario |
| F1-07 | Crear mañana | No aparece acción ni se realiza insert |
| F1-08 | Eliminar/cancelar | Cancelar conserva; confirmar borra realmente |
| F1-09 | Cambio de mes/año | Fechas y colores correctos; lunes inicio |
| F1-10 | Fechas 28/29 feb, 31 dic | Sin cambios de fecha inesperados |
| F1-11 | Medianoche/DST en Europe/Madrid | Fecha civil correcta |
| F1-12 | Doble clic guardar | No duplica ni muestra éxito anticipado |
| F1-13 | Red caída al guardar | Error claro; borrador conservado en pantalla |
| F1-14 | Dos usuarios, RLS | Uno no lee, edita ni borra datos del otro |
| F1-15 | Usuario anónimo | No consulta entradas ni muestra rutas privadas |
| F1-16 | Sesión caducada | Manejo explícito, sin guardar falsamente |
| F1-17 | 360px y escritorio | Layout navegable, sin scroll horizontal |
| F1-18 | Accesibilidad | Labels, foco visible, click/tap, teclado y diálogos |

## Estado de verificación de la fase 1 (10-11-2026)

Distinción estricta: **«local»** = aprobado con repositorios en memoria (jsdom) o en navegador real sin Supabase; **«Supabase real»** = comprobado contra el proyecto de Laura. Ninguna fila está verificada todavía contra Supabase: la migración no está aplicada.

| ID | Local (aprobado) | Prueba preparada contra Supabase real | Estado real |
|---|---|---|---|
| F1-01 | `TodayPage.test` | `e2e/remote/journal` | Pendiente |
| F1-02/03 | `TodayPage.test` | `e2e/remote/journal` | Pendiente |
| F1-04 | — (necesita backend) | `e2e/remote/journal` (recarga y contexto nuevo) | Pendiente |
| F1-05 | `TodayPage.test`, `CalendarPage.test` | `e2e/remote/journal` + recuento de filas | Pendiente |
| F1-06 | `CalendarPage.test` | `e2e/remote/calendar` | Pendiente |
| F1-07 | `CalendarPage.test` (sin consulta) | `e2e/remote/calendar` + trigger SQL en `test:rls` | Pendiente |
| F1-08 | `CalendarPage.test` | `e2e/remote/calendar` + recuento de filas | Pendiente |
| F1-09 | `calendarGrid.test`, `CalendarPage.test` | `e2e/remote/calendar` | Pendiente |
| F1-10/11 | `dates.test`, `calendarGrid.test` (TZ Europe/Madrid) | — (lógica pura) | Cubierto localmente |
| F1-12 | `TodayPage.test` | `e2e/remote/journal` + recuento | Pendiente |
| F1-13 | `TodayPage.test` | `e2e/remote/journal` (`setOffline`) | Pendiente |
| F1-14 | — (necesita RLS) | `tests/rls` (11 casos) + `e2e/remote/isolation` | Pendiente |
| F1-15 | `AuthPage.test`, `e2e/local` | `tests/rls` (anónimo) | Parcial: UI local OK |
| F1-16 | `sessionExpiry.test`, `AuthProvider.test` | `e2e/remote/session-and-layout` (login real + 401 simulado) | Pendiente |
| F1-17 | `e2e/local` (páginas públicas, 360/1440) | `e2e/remote/session-and-layout` | Parcial |
| F1-18 | `accessibility.test` (axe, jsdom), `e2e/local` (axe con contraste) | `e2e/remote/session-and-layout` | Parcial |

Revisión manual adicional (10-11-2026, navegador real con datos en memoria, fuera del repositorio): axe-core sin infracciones (contraste incluido) en Hoy, Calendario, detalle, edición y confirmación a 360 y 1440 px. Teclado: Enter abre el detalle, el foco queda atrapado, Escape cierra y devuelve el foco a la celda, y las flechas cambian la emoción.

## Fase 2 — obligatorio

| ID | Flujo / riesgo | Esperado |
|---|---|---|
| F2-01 | 0 entradas | Estado vacío, estadísticas no falsificadas |
| F2-02 | Porcentaje 3/10/7 de 20 entradas | 15%/50%/35% correcta |
| F2-03 | Conteos por mes y rango | No suman fuera de período |
| F2-04 | Racha con hueco | Se interrumpe correctamente, hoy sin registrar admite ayer |
| F2-05 | Texto español con tildes y stopwords | Frecuencias robustas, no contar "de", "la" |
| F2-06 | Buscar logros/reflexión | Resultados reales y usuario actual |
| F2-07 | Export > 1.000 entradas | Paginación completa o error explícito |
| F2-08 | Import JSON inválido | No escribe ningún registro, muestra motivo |
| F2-09 | Conflictos importación | Política elegida respetada; no pérdida silenciosa |
| F2-10 | Export/import | Roundtrip conserva fechas, moods y texto |
| F2-11 | IA cancelar/copiar | No existe llamada a NVIDIA |
| F2-12 | IA confirmar entrada elegida | Solo recibe textos elegidos, no los excluidos |
| F2-13 | IA texto desactualizado | Detecta 409 y obliga a revisar |
| F2-14 | IA IDs de usuario ajeno | 403/404; no lee textos externos |
| F2-15 | IA 429, timeout, JSON corrupto | Mensaje seguro y retry controlado |
| F2-16 | Secreto NVIDIA en bundle | No aparece, inspección build |
| F2-17 | Eliminar/importar | Confirmación real y verificación posterior |
| F2-18 | Regresión PMV | Todo F1 sigue funcionando |

## Pruebas de seguridad RLS

Con dos usuarios de test A/B: SELECT, INSERT con `user_id` ajeno, UPDATE, DELETE y UPSERT ajenos, con tokens normales. Evidencias sin datos reales. Validar anónimo. No usar cuenta admin/service key para "probar" aislamiento porque bypass puede dar falsos positivos.

## E2E mínima

1. Login A → nuevo registro → save → calendario → refresh → edición → save → refresh → logout.
2. Login B → calendario vacío → no acceso a ID de A → logout.
3. Login A → añadir día anterior → eliminación con confirm → refresh.
4. Fase 2: export/import prueba aislada; IA previsualiza y cancela sin red; confirma con proveedor mock de pruebas y recibe schema válido.

## Evidencias del profesor

Capturas del calendario con datos voluntarios; notas reales de uso diario (solo fechas y mejoras, sin contenido íntimo); informe de mejora en `16`. No subir reflexiones personales ni tokens a repositorios o documentos públicos.
