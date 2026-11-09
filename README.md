# Florecer — documentación de implementación

Paquete de especificaciones para implementar Florecer con Claude Code o Codex.

**Estado:** planificación; NO incluye una aplicación implementada, credenciales ni cambios sobre `src/sass/`.

## Cómo integrarlo en el repositorio existente

1. Copiar `docs/`, `README.md` (si no existe otro; si existe, fusionar), `.env.example` (si procede) y `scripts/` a la raíz del repositorio.
2. Asegurar que `AGENTS.md` y `CLAUDE.md` son **symlinks al mismo archivo** `docs/AGENT_RULES.md` (incluidos en este ZIP).
3. Verificar los symlinks: `ls -l AGENTS.md CLAUDE.md` en Linux/macOS/WSL. En Windows, extraer con una herramienta compatible con symlinks o ejecutar `scripts/create-agent-links.ps1` (requiere permisos para crear symlinks; el script explica el fallo).
4. Iniciar Claude Code o Codex en la raíz, solicitar: **"Lee AGENTS.md, docs/INDEX.md y docs/09-IMPLEMENTATION-PLAN.md. Inspecciona el repo y especialmente src/sass antes de modificar nada. Ejecuta la fase 1 respetando criterios de aceptación."**
5. Configurar Supabase/Vercel y variables de entorno con **valores reales** suministrados por quien administra el proyecto; nunca poner secretos en el repositorio.

**Orden de lectura:** `AGENTS.md` → `docs/INDEX.md` → `docs/01-PRODUCT.md` → `docs/02-ARCHITECTURE.md` → `docs/03-MVP-PHASE1.md` → `docs/09-IMPLEMENTATION-PLAN.md`.

**Fechas de evaluación:** 12 de noviembre de 2026 (PMV), 26 de noviembre de 2026 (final). Son fechas académicas; no se deben sacrificar seguridad y persistencia real por aparentar avances.

**Nota:** `docs/references/claude-design-v2.dc.html` es una **referencia de diseño**, NO un HTML desplegable ni código fuente React. Contiene marcado y lógica del entorno Claude Design, datos ficticios y funciones simuladas.
