# Instrucciones canónicas para Claude Code y Codex

Este fichero es la única fuente para los symlinks **`/AGENTS.md` y `/CLAUDE.md`**. Leerlo primero.

## Misión

Implementar **Florecer**, diario emocional personal en español de España, en dos fases:
- **Fase 1 / 12-11-2026:** registro diario, calendario de colores, auth real, persistencia real, mobile-first, consulta/edición/eliminación con confirmación.
- **Fase 2 / 26-11-2026:** evolución, logros, búsqueda, análisis mediante NVIDIA con consentimiento, copia de seguridad, uso real y estabilidad.

## Procedimiento obligatorio antes de tocar código

1. Leer `docs/INDEX.md` y documentos pertinentes.
2. Inspeccionar archivos y herramientas del repositorio (`package.json`, `src/`, configuración, tests, lockfile, historial disponible y **árbol REAL de `src/sass/`**, incluyendo todos sus parciales, imports, variables y mixins).
3. Confrontar estructura real con `docs/02-ARCHITECTURE.md`, `docs/06-DESIGN-AND-SASS.md`; documentar divergencias y adaptar, sin rehacer estructuras existentes por comodidad.
4. Identificar la fase solicitada. Si no se explicita: implementar primero exclusivamente fase 1 y terminar su validación antes de empezar fase 2.
5. Plan breve de cambios y criterios de aceptación. Implementar de extremo a extremo, no botones falsos.
6. Ejecutar comprobaciones reales y comunicar resultados exactos. No afirmar que algo funciona si no se probó.

## Restricciones de arquitectura

- Frontend React + Vite + TypeScript estricto; `pnpm`; Supabase Auth y PostgreSQL; Vercel. Backend Node serverless exclusivamente para IA y otras operaciones que lo necesiten en fase 2.
- **`src/sass/` es la fuente única de estilos.** Conservar la base 7-1 existente. Añadir, integrar y actualizar parciales según su estructura; NO reemplazarla, moverla, crear una carpeta paralela `styles/`, instalar Tailwind o usar CSS-in-JS/CSS Modules por conveniencia.
- Importar un único entrypoint principal de SASS en el punto de entrada de la aplicación, respetando el existente. No crear un `main.scss` nuevo si ya existe un equivalente.
- Diseñar componentes reutilizables, separar UI / hooks de datos / repositorios / utilidades puras. No crear un monolito inspirado en el HTML de diseño.
- No cambiar el stack a Astro, Svelte, Next.js, Firebase u otro sin motivo técnico documentado y autorización.
- No introducir complejidad gratuita: microservicios, Redux, Docker obligatorio, colas, PWA/offline, cifrado propio o servicios de pago no requeridos.

## Seguridad y privacidad, no negociables

- Toda tabla con datos de usuario debe tener RLS correctamente activado y políticas por `auth.uid()`. Probar aislamiento con **dos cuentas de prueba** distintas. Nunca asumir que ocultar una pantalla es seguridad.
- **Nunca** enviar `service_role`, secretos NVIDIA ni tokens privados al navegador; únicamente publicar la clave anon/publishable de Supabase según su modelo de seguridad.
- Nunca poner contenido de reflexiones, contraseñas, JWT, payloads de IA ni copias personales en logs, fixtures, commits o pruebas.
- Nunca usar entradas ficticias en cuentas reales. Fixtures solo test/dev aislado y señalizado.
- No enviar nada a NVIDIA sin vista previa íntegra, selección explícita de entradas y confirmación por acción humana; alternativa local `Copiar para ChatGPT`.
- La IA no diagnostica ni infiere trastornos, ni promete certeza emocional. Sus resultados son sugerencias revisables.
- Borrado/importación destructiva requiere confirmación; sin despliegues, borrados de recursos, migraciones a producción ni operaciones remotas destructivas sin autorización expresa del usuario responsable.
- Respetar condiciones de uso/protección de datos aplicables; no hacer promesas absolutas de privacidad ni retención no verificadas.

## Integridad funcional

- Un registro por usuario y fecha; `mood` obligatorio, reflexión/logro opcionales.
- Fechas locales `YYYY-MM-DD`, sin convertir días del calendario a UTC por accidente. Comprobar cambios de mes/año, huso y DST.
- Guardar no significa "mostrar toast": éxito solo tras confirmación del backend y posterior lectura fiable.
- Estados de carga, error, vacío y reintento; accesibilidad de formularios, navegación, modales y controles.
- La app debe funcionar sin NVIDIA: es una función secundaria de fase 2.
- Las estadísticas se derivan de entradas reales, nunca valores hardcodeados de la maqueta.

## Convenciones de desarrollo

- TS strict; evitar `any`, `as unknown as`, asserts innecesarios, errores silenciados, lógica de fechas duplicada, efectos con dependencias incorrectas.
- React: componentes de presentación + feature modules; obtener datos con `@tanstack/react-query` si existe/según plan, no levantar estados remotos globales caseros.
- Validación de datos en formularios, servicio y DB; Zod especialmente en límites externos.
- `snake_case` en SQL, `camelCase`/`PascalCase` en TS; adaptadores explícitos.
- No incluir datos sensibles en mensajes de error, telemetría o herramientas de análisis.
- CSS responsive, tokens existentes o compatibles, focus visible, WCAG AA razonable y `prefers-reduced-motion`.
- No realizar commits/push por defecto si no se solicitan; preservar archivos y cambios previos.

## Al cerrar cada bloque de trabajo

Entregar resumen: archivos modificados, flujo implementado, pruebas ejecutadas con resultados, bloqueos (credenciales/servicios), riesgos, próximos pasos. No declarar "finalizado" con mocks en flujos obligatorios.

Leer en especial: `docs/03-MVP-PHASE1.md`, `docs/09-IMPLEMENTATION-PLAN.md`, `docs/10-TEST-PLAN.md`.