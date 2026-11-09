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
