# 16 — Evaluación académica y registro de mejoras reales

## Criterios del profesor

PMV 3 puntos (principal funciona). Final 7 puntos: funcionamiento 2 (persistencia), mejoras 3 (justificadas por uso), uso real 2 (registros reales en el período). El profesor busca iteración y calidad, no una lista de features sin motivo.

## Plantilla de mejora (copiar una por cada cambio REAL)

```
Fecha:
Función antes:
Problema observado al utilizarla:
Mejora concreta implementada:
Por qué facilita la vida de la usuaria (1 frase):
Cómo se verificó (prueba/acción):
Estado: propuesta | implementada | validada
```

## Ejemplos hipotéticos, NO registrarlos como hechos

- "Permití corregir una entrada de un día pasado porque necesitaba actualizar lo que había escrito tras recordarlo mejor."
- "Añadí un resumen mensual para observar la distribución sin abrir todas las fechas."
- "Añadí una copia descargable para poder recuperar los registros sin depender solo del móvil."
- "Incluí una revisión previa al análisis de IA para elegir qué reflexiones quiero compartir."

Nunca inventar feedback, sesiones de prueba, número de días usados ni razones; pedir a la usuaria su valoración real y registrarla sin copiar sus reflexiones personales.

## Registro de uso real sin invadir intimidad

| Fecha | Usó Hoy | Observación de interfaz (sin texto del diario) | Ajuste propuesto |
|---|---|---|---|
| YYYY-MM-DD | Sí/No (voluntario) | P. ej. selector demasiado pequeño | Aumentar área táctil |

No crear entradas artificiales para demostrar uso. Mostrar profesor calendario con fechas/colores y eventualmente resúmenes, ocultando texto íntimo si es preferible.

## Checklist antes de 12 noviembre

- Función core PMV real y red desplegada.
- Guardado tras cerrar/reabrir, aislamiento RLS.
- Instrucciones para demo con cuenta permitida.
- Registrar mejoras propuestas por profesor sin afirmarlas como ya implementadas.

## Checklist antes de 26 noviembre

- Todas las regresiones del MVP pasan.
- Cambios realmente implementados y justificados en una línea cada uno.
- Registros reales voluntarios y evidencia proporcionada con privacidad.
- Copia de seguridad export/import probada.
- Si IA falla, no afecta diario ni produce falsos resultados.
- Lista de fallos corregidos y limitaciones restantes honesta.

## Plantilla del informe final

1. Problema y usuario; 2. PMV enseñado (qué hacía); 3. Qué se aprendió usándolo; 4. Cambios: necesidad → mejora → prueba; 5. Evidencia de uso (agregada); 6. Seguridad y almacenamiento; 7. Tests y fallos encontrados/corregidos; 8. Limitaciones.
