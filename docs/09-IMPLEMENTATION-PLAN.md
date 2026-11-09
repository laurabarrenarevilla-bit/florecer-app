# 09 — Plan de implementación y orden de trabajo

**Referencia temporal:** 9 noviembre 2026. Entregas académicas 12 y 26 noviembre. No confundir esta planificación con un trabajo ya realizado.

## Milestone 0 — Inspección y bootstrap (antes de modificar)

- Revisar árbol del repositorio, package.json, scripts, lockfile, `src/sass/` real y cualquier artefacto anterior.
- Leer `docs/INDEX.md`, `02`, `03`, `05`, `06`, `07`.
- Acordar comando de dev/build/test; configurar `.env.example`, TypeScript strict, lint y carpetas solo si no existen.
- Reaprovechar parciales y tokens SASS reales, evitando duplicidad.
- Preparar dos entornos Supabase (si posible), establecer claves no sensibles cliente.

**Gate M0:** build inicial, estructura documentada, ningún archivo preexistente pisado.

## Milestone 1 — Auth real

- Configurar Supabase client, estados auth y rutas protegidas.
- Login/logout; cuenta privada habilitada/creada; errores útiles.
- No mostrar pantallas privadas antes de resolver sesión.

**Gate M1:** acceso real y logout tras recarga, sin bypass UI.

## Milestone 2 — Datos y CRUD

- Migración `journal_entries` con RLS, constraint y timestamp update.
- Tipos TS y repositorio de consulta/guardado/borrado.
- Zod, tests de 2 usuarios, fecha local y un registro por día.

**Gate M2:** prueba DB real y aislamiento, no mock.

## Milestone 3 — UI Hoy + Calendario

- Shell responsive y componentes desde la base SASS.
- Hoy: crear, ver, editar, confirmación solo tras DB.
- Calendario: colores, cambio mes/año, fechas pasadas, detalle, editar/eliminar, vacíos.
- Navegación y errores, sin funcionalidades dummy.

**Gate M3:** suite PMV y guion de evaluación `03` superados en navegador real móvil y desktop.

## Milestone 4 — Despliegue PMV

- Vercel SPA + env reales + redirects Auth, configuración Supabase y verificación en dispositivo real.
- Ejecutar checklist predespliegue y documentar URL/commit/fecha sin secretos.
- Probar cierre/reapertura y caso de red caída.
- Una vez estable, dejar que usuaria comience a usarlo libremente.

**Gate M4:** `GO fase 1`; no pasar a fase 2 con defectos P0.

## Milestone 5 — Evolución e historial

- Estadísticas y rachas derivadas, palabras frecuentes y logros.
- Búsqueda y filtros reales, estados vacíos, cálculos puros bajo tests.
- Feedback de la usuaria incorporado al `16`.

**Gate M5:** cifras correctas en fixtures y reales, nada hardcodeado.

## Milestone 6 — Datos portables

- Export JSON paginada; import JSON validada con vista previa y conflictos; verificación post-import.
- Aviso de archivo sin cifrar y recomendación de custodia.
- Gestión de privacidad/eliminación coherente.

**Gate M6:** prueba roundtrip export/import con cuenta aislada, sin duplicados.

## Milestone 7 — IA protegida

- Endpoint Vercel, validar auth y permisos, seleccionar entradas/preview, consentir, NVIDIA, resultado validado.
- Timeout, errores, cuotas y modo copy sin envío automático.
- No datos privados en logs; pruebas negative.

**Gate M7:** flujo end-to-end real, permisos y costos controlados.

## Milestone 8 — Estabilización final

- Pruebas funcionales/regresión, accesibilidad, responsive, backup recuperación, criterios `04`.
- Registrar mejoras derivadas del uso real y evidencias sin reflexiones personales.
- Auditar SASS, dependencias, secrets, RLS, deploy y fallos pendientes.

**Gate M8:** "GO final" solo con funcionamiento real y documentación verificada.

## Severidad

- P0: pérdida de datos, acceso ajeno, secreto expuesto, imposible guardar/login, prod caída.
- P1: importación incorrecta, fecha desplazada, estadísticas falsas, envío IA sin consentimiento.
- P2: bugs de presentación menores, animaciones o textos secundarios.

P0 bloquea entrega; P1 bloquea la funcionalidad afectada, que debe ocultarse o corregirse antes de presentarla. En situación de tiempo limitado, **recortar alcance**, no mentir en el estado.
