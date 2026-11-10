# 06 — Diseño y uso obligatorio de la base SASS 7-1

## Fuente visual

`references/claude-design-v2.dc.html`: versión visual preferida. Contiene marcado particular de Claude Design (`x-dc`, `sc-if`, `sc-for`) y `support.js` externo: **NO es React ni HTML portable ni comportamiento listo para reutilizar**. Usarlo para composición, tamaños relativos, textos, colores, interacción; reconstruir semánticamente.

## Identidad

- Fondo verde salvia muy suave `#F2F7F2`; superficies y campos blancos `#FFFFFF`; fondos neutros secundarios `#E7EFE7`; verde oscuro `#354E41`; verde salvia `#8BAA91`.
- Feliz amarillo `#F5D36A`; normal naranja `#F2A66E`; triste azul `#91BCE0`.
- Texto primario `#29332D`, secundario `#59685E`, sutil `#607065`; borde `#DBE5DC`, borde fuerte `#C7D5C9` y borde de campos `#7E9082`.
- Tipos: Fraunces (títulos), DM Sans (cuerpo), alternativas de sistema si no cargan.
- Respeto editorial, cálido, sin dashboard corporativo ni gradientes violetas.
- Colores emoción accesibles con etiquetas y/o iconos, no solo color.
- No adoptar automáticamente los colores del prototipo si rompen WCAG; ajustar contraste conservando estética.

Actualización 10-11-2026 por petición del usuario: sustituir el crema del prototipo por una base salvia suave y acogedora (el gris se descarta por resultar frío), incluidos campos, bordes, metadatos del navegador y manifest PWA. Se conserva la estructura SASS 7-1 real y el único entrypoint `src/sass/main.scss`; sin divergencias estructurales con `02`.

## NAV y pantallas

Hoy, Calendario, Evolución, Ajustes. Móvil nav inferior con safe-area, escritorio sidebar discreta. Ancho lectura limitado, no tablas anchas ni scroll horizontal. Calendario tiene celdas coloreadas, hoy/seleccionado diferenciados y leyenda. Modales y paneles móviles con foco, Escape, cierre explícito, scroll y teclado.

## Regla absoluta sobre `src/sass/`

**Hay una base SASS 7-1 existente en el proyecto real, pero no está incluida en este paquete. NO INVENTAR SU CONTENIDO.** Procedimiento obligatorio:

1. `find src/sass -maxdepth 4 -type f | sort` (o equivalente) y leer parciales, imports, variables, funciones, mixins y entrypoints.
2. Identificar las **siete categorías reales que estén presentes** y su convención: abstracts, base, components, layout, pages, themes, vendors suelen ser habituales, pero pueden llamarse diferente.
3. Respetar carpeta, nomenclatura y punto de entrada ya existentes. Si falta una categoría, crearla **solo si** lo exige un componente y encaja con la arquitectura base, sin duplicar categorías.
4. Ajustar tokens y parciales existentes antes de introducir valores duplicados. No romper mixins/functions o `@use`/`@forward`.
5. Importar el **entrypoint ya existente** una sola vez en `src/main.tsx` o punto de entrada correspondiente.
6. Verificar build y cascade; eliminar solo código nuevo redundante; no borrar la base ni renombrarla masivamente.

Ejemplo conceptual (NO orden de crear literalmente):

```
src/sass/
  abstracts/  # variables, colors, typography tokens, functions, mixins
  base/       # reset, fonts, globals, accessibility
  components/ # buttons, form, mood-selector, cards, calendar-cell, dialog
  layout/     # app-shell, nav, grid, header
  pages/      # today, calendar, evolution, settings, auth
  themes/     # theme defaults, optional modes
  vendors/    # overrides a CSS externo, solo si se necesita
  main.scss   # entrypoint de lo que ya exista
```

Lo que decide la carpeta real es la carpeta real, NO este ejemplo. No usar Tailwind, CSS Modules, styled-components, emotion ni inline styles para reemplazar el sistema. Se permiten `style` dinámicos puntuales para valores calculados (p. ej. anchos porcentuales) si no hay una alternativa SCSS accesible, nunca para maquetación general.

## Diseño responsive y accesibilidad

- Mobile-first desde 360px, comprobaciones 375, 390, 430, 768, 1024, 1440px.
- Áreas táctiles objetivo ~44x44 CSS px, labels claros, inputs con foco visible, tab order correcto.
- Texto body >=14-16px según contexto, line-height cómodo, contraste AA donde aplique.
- Foco controlado en modal, cierre Escape/restauración de foco, no scroll bloqueado tras cerrar.
- Preferencia `prefers-reduced-motion`; no toggle de reducción de movimiento si no funciona.
- Inputs día y texto no se tapan bajo nav con teclado móvil abierto.
- Estados: vacío, guardando, éxito confirmado, error, sesion caducada, no datos suficientes.

## UX textual

Español de España. Evitar “debes ser feliz”, métricas moralizantes, diagnóstico. Ejemplos: “¿Cómo te has sentido hoy?”, “¿Qué te gustaría recordar de hoy?”, “¿De qué te sientes orgullosa hoy?”, “Tu día ha quedado guardado”, “No se ha podido guardar. Tu texto sigue aquí; inténtalo de nuevo”. Sin nombre Laura hardcodeado ni biografía asumida en producción.

## Componentes de referencia

AppShell, BottomNav, SideNav, PageHeading, MoodSelector, JournalForm, EntrySummary, MonthCalendar, DayCell, DayDetailDialog/Sheet, ConfirmDialog, Button, TextField, TextArea, EmptyState, Toast/InlineAlert, LoadingState, MoodLegend. Fase 2 añade StatsCards, MoodTimeline, MoodDistribution, FrequentWords, AchievementList, AIEntryPicker, AIConsentDialog, AIReport, BackupImportPreview.
