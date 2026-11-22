# 13 — Estadísticas, lenguaje y fechas (fase 2)

## Fuente de verdad

Las filas reales `journal_entries` del usuario actual. No almacenar totales/rachas ni calcularlos a partir de un calendario incompleto. Si se carga solo parte de un intervalo, mostrar carga/no disponible, no cifras aparentemente completas. Si hay paginación, recorrer todas las páginas necesarias.

## Filtros de período

- Últimos 7 días: hoy inclusive y 6 anteriores (fechas civiles locales).
- Últimos 30 días: hoy inclusive y 29 anteriores.
- Este mes: día 1 a hoy inclusive, no agregar días futuros como ausencias.
- Historial completo: desde primera entrada hasta hoy.
- Toda agregación restringida a la cuenta autenticada.

## Conteos y distribución

`registeredDays = entries.length` (garantizado único fecha usuario); `moodCount(m) = count(entry.mood === m)`. Si registros > 0, `percentage = count/registeredDays * 100`, redondear solo en visualización; garantizar que la suma no se interprete como exacta si se redondea a enteros. Si 0 registros: estado vacío, no usar denominador ficticio 1 ni mostrar porcentajes 0% con gráficos llenos.

## Rachas

- Racha máxima: mayor secuencia de fechas civiles consecutivas con entrada, independiente de emoción.
- Racha actual: secuencia que termina hoy si hoy hay entrada; si no, secuencia que termina ayer; si ninguno tiene entrada, 0. No castigar explícitamente por un día sin escribir.
- Una edición de mood o texto no cambia la fecha ni racha; insertar o eliminar fecha sí.
- Uso de aritmética de **fechas civiles** (no sumar 86.400.000 ms porque DST cambia).

## Línea emocional

Una celda por fecha del período, color según mood; sin registro neutro. Mostrar fecha y etiqueta accesible; el azul no significa diagnóstico ni peor puntuación. Este mes termina hoy (no pintar futuro como hueco triste).

## Períodos de Evolución (22-11, ADR-011)

- Semana: lunes a domingo de la semana elegida, sin pasar de hoy.
- Mes: día 1 al último día del mes, sin pasar de hoy.
- Año: 1 de enero al 31 de diciembre, sin pasar de hoy.
- Navegar al período anterior y al siguiente; el siguiente se limita al período actual.
- Comparación: el mismo tipo de período inmediatamente anterior. Se muestran cantidades y porcentajes de cada uno, sin flechas de "mejor" ni "peor".

## Gráfico de anillo ("quesito")

Una porción por ánimo con su color, proporcional a `moodCount / registeredDays`. Opcionalmente, un segundo anillo con las emociones secundarias, sobre el total de emociones marcadas, indicando que las entradas sin emociones no cuentan. Sin registros: estado vacío, sin anillo gris. Los datos también aparecen en texto o tabla accesible, nunca solo por color.

## Emociones secundarias

- `emotionCount(e)` = número de entradas del período que incluyen `e`.
- Una entrada con 3 emociones suma 1 a cada una.
- El porcentaje se calcula sobre las entradas con al menos una emoción, y ese denominador se indica en pantalla.

## Patrones descriptivos

- Emoción secundaria más frecuente del período.
- Ánimo predominante por día de la semana, en períodos con al menos 2 registros de ese día.
- Días con logro y rachas.

Reglas:
- Mínimo para mostrar patrones: 5 días registrados en el período. Con menos, se muestra el mensaje "Aún hay pocos registros para ver patrones".
- En caso de empate, se muestran todas las opciones empatadas, sin elegir una al azar.
- El texto es descriptivo y en pasado ("registraste"). No predice nada, no diagnostica y no valora.

## Palabras frecuentes

- Fuente: `reflection` (y opcional `achievement` si UI lo indica claramente), solo el período.
- Unicode normalize, lowercase `es-ES`, segmentación por palabras y puntuación, stopwords frecuentes del español, longitud mínima 3, excluir números y tokens irrelevantes.
- Decidir si colapsar tildes para conteo (ej. `día` ≠ `dia` visualmente, tratarlo de forma consistente); conservar palabra visual legible.
- Top 5-10 por frecuencia descendente y desempate alfabético estable.
- Si texto insuficiente, mensaje "Aún no hay suficientes reflexiones para mostrar palabras frecuentes", no palabras inventadas.

## Logros

Extraer `entry.achievement.trim() !== ''`, ordenar desc fecha y mostrar referencia de día. No inventar logros a partir de una reflexión: IA sí podría mencionar algo relatado, etiquetado como interpretación, nunca añadirlo automáticamente a registros.

## Casos extremos para tests

Febrero bisiesto, diciembre→enero, marzo/octubre DST Europe/Madrid, medianoche, 30 días con meses de diferente longitud, fechas sin entrada y cambios al editar/borrar. `Date.parse('YYYY-MM-DD')` puede interpretarse UTC: encapsular utilidades `parseLocalDate`, `formatLocalDate`, `addCalendarDays`, `dateRange` y testarlas.

## Implementación (22-11-2026)

- **Racha actual y racha más larga:** se muestran arriba en Evolución y se calculan sobre todo el historial (`useAllEntries`), no solo sobre el período visible. Son `currentStreak` y `longestStreak` en `src/features/evolution/stats.ts`.
- **Palabras frecuentes** (`src/features/evolution/words.ts`):
  - salen de las reflexiones del período, segmentadas con `Intl.Segmenter`;
  - se quitan las palabras vacías, las de menos de 3 letras y las que llevan números;
  - al contar se ignoran las tildes, pero la ñ se respeta;
  - se muestra la forma más escrita de cada palabra;
  - salen las 8 primeras con al menos 2 apariciones, y solo si hay al menos 3 reflexiones.
- **Limitación conocida:** sin análisis morfológico, palabras como "río" (sustantivo) y "rio" (verbo) cuentan juntas.
