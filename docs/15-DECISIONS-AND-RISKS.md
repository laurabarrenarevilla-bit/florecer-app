# 15 — Decisiones arquitectónicas y registro de riesgos

## ADR-001: React + Vite (aceptada)

Una aplicación autenticada centrada en formularios y datos, sin SEO público. React/Vite TS ofrece SPA directa. Se descarta Next.js para evitar renderizado full-stack innecesario; se evita Astro para esta UI de estado continuo, y no se decide Svelte por preferencias históricas. Revisar únicamente ante necesidades nuevas documentadas.

## ADR-002: Supabase en la nube con RLS (aceptada)

Persistencia entre cierres/dispositivos y auth. Costes: dependencia de conectividad/proveedor y textos íntimos en nube, no local-only. Mitigaciones: RLS, cuenta privada, datos mínimos, backup descargable y copy IA opt-in. No prometer almacenamiento solo local.

## ADR-003: NVIDIA API exclusivamente servidor (aceptada para fase 2)

Credencial privada en Vercel Function. Se descarta llamada desde navegador. Debe verificarse disponibilidad del modelo y políticas antes de activarlo.

## ADR-004: SASS 7-1 existente (obligatoria)

Conservar árbol real y modificar parciales existentes. No introducir sistema paralelo. La ausencia de carpeta en este paquete NO autoriza recrearla arbitrariamente.

## ADR-005: Almacenamiento de análisis IA (no persistir por defecto)

El análisis es temporal; guardar informe requiere propósito explícito, contrato de datos, privacy review y RLS nuevos. Reduce retención y alcance.

## ADR-006: Dominio mood fijo (aceptada)

`happy`, `neutral`, `sad` en DB; nombres en español solo UI. Evita inconsistencias del prototipo.

## ADR-007: Fechas civiles (aceptada)

`entry_date DATE` y utilidades de fecha local. Los timestamps registran creación/edición, nunca determinan el día de la emoción.

## ADR-008: Acceso privado inicial (sustituida por ADR-009)

Una cuenta de uso controlado y sin registro público innecesario. **Sustituida el 09-11-2026** por la decisión de registro público sin confirmación de email: ver `docs/decisions/ADR-009-fase1-implementacion.md`.

## ADR-009: Implementación de fase 1 y registro público (aceptada)

Ver `docs/decisions/ADR-009-fase1-implementacion.md`.

## ADR-010: PWA instalable con caché estática (en producción, se mantiene)

Ver `docs/decisions/ADR-010-pwa-instalable.md`. Solicitada por el usuario:
instalación, caché de archivos públicos y actualización protegida; sin diario offline.
Publicada en florecer-diario.vercel.app y revisada el 10-11-2026 (la caché no contiene
datos personales). El usuario decide mantenerla en la fase 1, como excepción a CLAUDE.md.
Pendiente: validar la instalación en dispositivos Android/iOS reales.

## Riesgos

| Riesgo | Impacto | Plan |
|---|---|---|
| PMV no guarda en DB | P0 | bloquear features extra hasta verificar CRUD |
| RLS abierta | P0 | tests A/B y SQL review |
| Fecha desplazada un día | P1 | utilidades locales + pruebas DST |
| Pérdida durante fallo de red | P0/P1 | conservar borrador, confirmar backend |
| NVIDIA expuesta al cliente | P0 | secretos solo server, inspección build |
| Promesas falsas de privacidad | P1 | mensajes revisados y verificados |
| Import destructivo | P1 | preview, skip defaults, validación |
| UI no usable en móvil | P1 | QA 360px + teléfono real |
| Prototipo interpretado como código listo | P1 | reconstruir React, no copiar DCLogic |
| Reescribir SASS existente | P1 | inspeccionar antes y respetar convención |
| IA inventa hechos personales | P1 | schema, advertencias, textos prudentes |
| Exceso de funciones antes del 12 | P0 de proyecto | gates y recorte de alcance |
| Demostración expone reflexiones | P1 | cuenta demo aislada o datos agregados |

## Cambio de decisión

Toda decisión material nueva necesita descripción, motivo, alternativas, impacto en UX/seguridad, fase, pruebas y fecha. Guardar ADR dentro de `docs/decisions/ADR-xxx-slug.md`, actualizar este índice y no introducir stack por impulso.
