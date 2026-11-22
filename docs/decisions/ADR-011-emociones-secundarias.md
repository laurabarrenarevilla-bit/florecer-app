# ADR-011 — Emociones secundarias y alcance de la fase 2 tras el feedback del profesor

- **Estado:** aceptada (22-11-2026).
- **Fase:** 2 (entrega 26-11-2026).
- **Origen:** feedback del profesor tras ver la fase 1, y decisiones del usuario del 10-11 y el 22-11.

## Feedback recibido

| Tipo | Feedback | Decisión |
|---|---|---|
| A mejorar | Identificar patrones | **Sí**: patrones descriptivos calculados por código (§4). |
| A mejorar | Preguntas de introspección | **Sí**: pregunta orientativa en Hoy, de una lista fija (§3). |
| Sugerencia | Ver anual y semanalmente | **Sí**: Evolución con semana, mes y año. |
| Sugerencia | Gráfico circular ("quesito") de emociones en el tiempo | **Sí**: gráfico de anillo por período + franja diaria. |
| Sugerencia | Emociones más concretas dentro de cada principal | **Sí**: emociones secundarias (§1–2). |
| Sugerencia | Guardar sin conexión y subir después | **No en esta entrega** (§5). |

## 1. Emociones secundarias: modelo

Basadas en la rueda de emociones de Plutchik, agrupadas bajo los tres ánimos existentes. Se usa un solo nivel de intensidad (el intermedio) para no saturar la pantalla del móvil.

| Ánimo (`mood`) | Emociones (`emotions`, código → etiqueta) |
|---|---|
| `happy` · Alegría | `serenity` serenidad, `optimism` optimismo, `love` amor, `trust` confianza, `interest` interés, `admiration` admiración |
| `neutral` · Normal | `acceptance` aceptación, `anticipation` anticipación, `surprise` sorpresa, `distraction` distracción, `boredom` aburrimiento |
| `sad` · Tristeza | `melancholy` melancolía, `disappointment` decepción, `remorse` remordimiento, `fear` miedo, `anger` enfado, `disgust` asco |

- **Opcionales**, de 0 a 3 por entrada, sin repetir. El ánimo principal sigue siendo obligatorio y la base de toda estadística existente.
- Deben pertenecer al grupo del ánimo. Si se cambia el ánimo, la UI descarta las emociones que ya no encajan **antes** de guardar, avisando visualmente.
- Códigos en inglés en la base de datos y etiquetas en español solo en la UI (igual que ADR-006).
- El grupo `sad` reúne también miedo, enfado y asco: su etiqueta visible puede cambiar ("Mal día") sin tocar datos. Se mantiene "Tristeza" hasta que el usuario decida otra cosa.

## 2. Datos y seguridad

Migración `supabase/migrations/20261122000000_journal_emotions.sql`:

- `emotions text[] not null default '{}'`: las entradas existentes quedan válidas, sin emociones.
- Restricciones `journal_entries_emotions_max` (≤ 3), `_no_nulls` y `_match_mood` (subconjunto del grupo de su `mood`). El trigger existente rechaza además repetidas.
- `grant insert/update (emotions)` a `authenticated`; las políticas RLS existentes cubren la columna sin cambios.
- Validación triple: Zod en el formulario, Zod en el repositorio y restricciones en la base de datos.
- Compatibilidad: el cliente de la fase 1 pide las columnas por nombre, así que la migración no le afecta. Hay un caso límite: si alguien con la versión antigua en caché (PWA) cambia el ánimo de una entrada que ya tiene emociones, la base de datos rechaza el cambio y la app muestra el error de guardado habitual, sin perder datos. La actualización de la PWA lo resuelve.
- Reversión: `supabase/manual/rollback_20261122000000_journal_emotions.sql` (aborta si hay emociones guardadas).
- Pruebas: `pnpm test:db` (PGlite local, migraciones reales, dos usuarios) y casos nuevos en `pnpm test:rls` (remoto, con autorización).

## 3. Preguntas de introspección

- En el formulario del diario (Hoy y edición desde el calendario), una pregunta orientativa sobre la reflexión ("¿Qué te ha dado energía hoy?"), con botón "Otra pregunta".
- Lista fija en el código, en español, sin IA y sin datos del usuario. Ninguna pregunta presupone un estado emocional concreto ni es clínica.
- La pregunta no se guarda: solo inspira. Lo que se guarda es la reflexión que escriba la persona, como hasta ahora.
- Las preguntas de reflexión del resumen de IA (fase 2, ver `08`) son otra función distinta.

## 4. Patrones

Patrones descriptivos calculados por código sobre las entradas reales del período: emoción secundaria más frecuente, ánimo predominante por día de la semana, días registrados, racha actual y máxima, y días con logro. Se presentan como observaciones ("Los lunes registraste más días de Tristeza"), sin puntuaciones, sin "mejora/empeora" y sin diagnósticos. Si hay pocos datos, se dice en lugar de mostrar un patrón débil (mínimo por definir en `13`).

## 5. Guardar sin conexión: descartado para el 26-11

- `CLAUDE.md` y `04` excluyen el modo offline y la sincronización local-first.
- Sincronizar con conflictos (dos dispositivos, edición tras borrado) sin perder ni duplicar entradas no se puede probar con garantías en 4 días.
- Se mantiene lo que ya existe: si no hay conexión, el texto se conserva en pantalla, no se anuncia éxito y se puede reintentar.
- Queda registrado como mejora futura en `16`.

## Alternativas descartadas

- Rueda completa de 24 emociones y 3 intensidades: demasiadas opciones en móvil.
- Tabla aparte `entry_emotions`: más joins y políticas RLS para una lista corta y cerrada.
- Emoción secundaria única: el usuario y el profesor buscan precisión; varias emociones a la vez son habituales.
