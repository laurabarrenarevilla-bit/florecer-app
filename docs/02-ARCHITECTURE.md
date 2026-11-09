# 02 — Arquitectura y organización del código

## Decisión

**Monorepo sencillo**: React + Vite + TypeScript estricto + Sass existente `src/sass/`; Supabase Auth/PostgreSQL (cliente autenticado con RLS); Vercel para SPA y `api/` Node serverless en fase 2; NVIDIA invocado únicamente desde servidor.

## Diagrama de flujos

```
Navegador móvil / desktop (SPA React)
  ├─ Supabase Auth → sesión JWT
  ├─ Supabase PostgREST → journal_entries [RLS por usuario]
  └─ POST /api/ai/analyze [fase 2, JWT y selección explícita]
         ├─ verificar JWT (Supabase Auth)
         ├─ leer entradas seleccionadas con permisos de usuario
         ├─ validar límites/consentimiento
         └─ NVIDIA API (clave solo en servidor)
```

## Capas

- `app/`: arranque, proveedores (router, query client, contexto auth), límites de error.
- `features/auth/`: formularios, sesión, recuperación, rutas protegidas.
- `features/journal/`: formulario, vista del día, hooks, repositorio y adaptadores.
- `features/calendar/`: grid, selección de fechas, detalle y edición.
- `features/evolution/`: estadísticas y logros, fase 2.
- `features/ai/`: consentimiento y presentación del análisis, fase 2.
- `features/settings/`: cuenta, exportar/importar/eliminar, fase 2.
- `shared/ui/`: botón, input, modal, feedback, navegación, layout; estilos solo en SASS 7-1.
- `shared/lib/`: fechas, normalización de texto, error mapping y utilidades puras.
- `lib/supabase/`: instancia de cliente y tipos generados; sin lógica visual.
- `api/ai/analyze.ts`: endpoint Vercel (fase 2) sin secretos compartidos con frontend.
- `supabase/migrations/`: SQL versionado para DB y RLS.
- `tests/`: unitarias, integración y E2E por flujos.

## Árbol orientativo NO destructivo

```
/
├── AGENTS.md          -> CLAUDE.md   (symlink)
├── CLAUDE.md          (instrucciones canónicas)
├── docs/              (este paquete)
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers/
│   ├── features/
│   │   ├── auth/
│   │   ├── journal/
│   │   ├── calendar/
│   │   ├── evolution/      (fase 2)
│   │   ├── ai/             (fase 2)
│   │   └── settings/
│   ├── shared/
│   │   ├── ui/
│   │   └── lib/
│   ├── lib/supabase/
│   └── sass/             (BASE EXISTENTE: conservar todo)
├── api/
│   └── ai/analyze.ts     (solo fase 2)
├── supabase/migrations/
├── tests/
├── public/
├── .env.example
├── package.json
├── pnpm-lock.yaml
└── vite.config.ts
```

**No imponer este árbol a un repositorio ya estructurado**: adaptarlo; el objetivo son límites claros, no nombres ceremoniales.

## Estado remoto y navegación

- React Router para `/login`, `/registro` opcional, `/recuperar-acceso`, `/hoy`, `/calendario`, `/evolucion`, `/ajustes` y fallback.
- Enlace profundo directo en Vercel mediante configuración SPA/rewrite apropiada.
- TanStack Query para consultas y mutaciones remotas; invalidar listas después de guardar/borrar. Evitar cachear reflexiones persistentemente en `localStorage`.
- React state para el formulario, filtros y modales; no Redux.
- Formularios con HTML semántico y Zod; RHF opcional solo si simplifica.
- Fechas con `date-fns` o utilidades puras testadas; `es` para formato, lunes primer día de semana.

## Dependencias sugeridas

Runtime: `react`, `react-dom`, `react-router-dom`, `@supabase/supabase-js`, `@tanstack/react-query`, `zod`, `date-fns`, `lucide-react`. Dev: `typescript`, `vite`, `sass`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@playwright/test`, `eslint`, `prettier`, `@types/*`. Puede cambiarse si `package.json` real ya resuelve lo mismo. Para gráficas fase 2, preferir barras HTML/CSS accesibles y timeline antes de sumar biblioteca; incorporar una solo si la visualización lo exige.

## Justificación y límites

- React/Vite: SPA principalmente interactiva, sin SEO público crítico.
- Supabase: CRUD simple y autenticación sin construir backend general; RLS obligatorio.
- Vercel Functions: protege NVIDIA API key sin servidor permanente; no maneja el CRUD normal.
- No PWA/offline completo en fase 1: la persistencia en nube no supone disponibilidad sin conexión; evitar prometerla. PWA fase 2 **solo si** no amenaza funcionalidades esenciales y se verifica alcance.
- No guardar análisis por defecto: generar a demanda y mostrar, reducir retención de contenido sensible. Persistencia de informes requiere decisión explícita posterior.

## Concurrencia y consistencia

Una entrada por día garantizada en DB. Mutaciones `upsert` con `onConflict: 'user_id,entry_date'` y políticas apropiadas; gestionar que una segunda pestaña haya actualizado la misma fecha (refetch y aviso, no sobrescritura silenciosa en flujos sensibles). Cualquier optimismo visual debe poder revertirse y marcar claramente guardado pendiente vs confirmado.
