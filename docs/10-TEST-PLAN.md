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

Distinción estricta: **«local»** = aprobado con repositorios en memoria (jsdom) o en navegador real sin Supabase. **«Supabase real»** = comprobado contra el proyecto de producción con dos cuentas sintéticas (A/B) y la clave publicable, el 10-11-2026 tras aplicar la migración `20261109000000`.

| ID | Local | Supabase real | Prueba real |
|---|---|---|---|
| F1-01 | ✅ | ✅ | `e2e/remote/journal` |
| F1-02/03 | ✅ | ✅ (1 fila) | `e2e/remote/journal` + recuento |
| F1-04 | — | ✅ recarga y contexto nuevo | `e2e/remote/journal` |
| F1-05 | ✅ | ✅ (sigue 1 fila) | `e2e/remote/journal` + recuento |
| F1-06 | ✅ | ✅ | `e2e/remote/calendar` |
| F1-07 | ✅ | ✅ UI + trigger SQL | `e2e/remote/calendar`, `tests/rls` |
| F1-08 | ✅ | ✅ (0 filas tras borrar) | `e2e/remote/calendar` + recuento |
| F1-09 | ✅ | ✅ | `e2e/remote/calendar` |
| F1-10/11 | ✅ (TZ Europe/Madrid) | — lógica pura | `dates.test`, `calendarGrid.test` |
| F1-12 | ✅ | ✅ (1 fila) | `e2e/remote/journal` + recuento |
| F1-13 | ✅ | ✅ (`setOffline`) | `e2e/remote/journal` |
| F1-14 | — | ✅ 11 casos RLS + UI | `tests/rls`, `e2e/remote/isolation` |
| F1-15 | ✅ | ✅ anónimo → 42501 | `tests/rls`, `e2e/local` |
| F1-16 | ✅ | ✅ login real + 401 simulado | `e2e/remote/session-and-layout` |
| F1-17 | ✅ 360/1440 | ✅ 360 | `e2e/local`, `e2e/remote/session-and-layout` |
| F1-18 | ✅ axe jsdom y Chromium | ✅ axe con contraste | `e2e/remote/session-and-layout` |

Fallos encontrados por las pruebas reales y corregidos el 10-11-2026:
- Tras cerrar sesión, la siguiente persona entraba en la pantalla anterior (p. ej. Ajustes) en lugar de en Hoy.
- Sin red, TanStack Query pausaba el guardado en silencio («Guardando…» indefinido); ahora falla al momento con «No hay conexión».

Pendiente en la URL desplegada: smoke del guion de 90 s de `docs/03` en un móvil real.

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
