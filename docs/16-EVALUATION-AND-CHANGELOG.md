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

## Feedback del profesor sobre la fase 1 (recibido el 22-11-2026)

| Feedback | Estado |
|---|---|
| Identificar patrones | Implementado el 22-11 en Evolución: patrones descriptivos con mínimo de 5 días, empates explícitos y sin valoraciones; tests unitarios |
| Preguntas de introspección | Implementado el 22-11 (15 preguntas fijas, botón "Otra pregunta"); tests RTL y E2E remota en verde |
| Ver anual/semanalmente | Implementado el 22-11: Evolución con semana, mes y año, navegación anterior/siguiente y estado en la URL |
| Gráfico tipo "quesito" de emociones | Implementado el 22-11: anillo por ánimo, franja diaria (semana/mes) y barras apiladas por mes (año), con los datos también en texto |
| Emociones concretas dentro de cada principal | Implementado el 22-11: migración en producción y RLS 14/14; interfaz en Hoy, calendario y resumen; tests RTL, E2E remota (guardar, recargar, editar, axe) en verde; falta desplegar |
| Guardar sin conexión y subir después | Mejora futura, fuera del 26-11 (ADR-011 §5) |

Actualizar el estado solo cuando esté implementado y verificado.

## Checklist antes de 26 noviembre

- Todas las regresiones del MVP pasan.
- Cambios realmente implementados y justificados en una línea cada uno.
- Registros reales voluntarios y evidencia proporcionada con privacidad.
- Copia de seguridad export/import probada.
- Si IA falla, no afecta diario ni produce falsos resultados.
- Lista de fallos corregidos y limitaciones restantes honesta.

## Plantilla del informe final

1. Problema y usuario; 2. PMV enseñado (qué hacía); 3. Qué se aprendió usándolo; 4. Cambios: necesidad → mejora → prueba; 5. Evidencia de uso (agregada); 6. Seguridad y almacenamiento; 7. Tests y fallos encontrados/corregidos; 8. Limitaciones.

## Registro de operaciones sobre Supabase

| Fecha | Proyecto | Operación | Método | Verificación |
|---|---|---|---|---|
| 10-11-2026 | producción (ref. en el panel; no se versiona) | Migración `20261109000000_journal_entries` (sha256 `a39e0b74…`) en una transacción, registrada en `supabase_migrations.schema_migrations` | Management API (equivale al SQL Editor), con autorización expresa | `rls_checks.sql`: RLS activada, 4 políticas `authenticated`, `anon` sin privilegios, insert/update por columna, 7 restricciones y trigger |
| 10-11-2026 | producción | Auth: Confirm email OFF (`mailer_autoconfirm`), contraseña mínima 8 con minúsculas, mayúsculas y dígitos | Management API, cuenta Owner, con autorización | Lectura de la configuración tras el cambio. Ya estaban: signup ON, Email ON, anónimos OFF, sin SMTP |
| 10-11-2026 | producción | Alta de cuentas sintéticas A/B por el registro público (una sola vez) | `pnpm test:rls` | 3 cuentas en total; 0 filas de prueba tras las pruebas |
| 10-11-2026 | producción | Migración `20261110000000_delete_my_account` (sha256 `e4b7023b…`): función `delete_my_account()` | Management API, transacción, con autorización | `SECURITY DEFINER`, `search_path` vacío, propietario `postgres`, ejecución solo para `authenticated`; registrada en `schema_migrations` |
| 10-11-2026 | producción | Prueba real de eliminación con la cuenta sintética C (creada y eliminada en la misma prueba) | `pnpm e2e:remote` | Cuenta C inexistente, 0 identidades y 0 entradas huérfanas; siguen 3 cuentas |
| 10-11-2026 | producción | Auth: *Site URL* `https://florecer-diario.vercel.app`; redirecciones permitidas a producción y `localhost:5173`/`4173` | Management API | Lectura de la configuración tras el cambio |
| 22-11-2026 | producción | Migración `20261122000000_journal_emotions` (sha256 `0c92ea7d…`) en una transacción, registrada en `schema_migrations` | Supabase CLI `db query`, con autorización expresa | Columna `emotions text[] not null default '{}'`; 3 restricciones nuevas; `authenticated` con insert/update en `emotions`, `anon` sin acceso; 4 políticas; las 13 entradas existentes intactas y sin emociones; `pnpm test:rls` 14/14 y 0 filas de prueba restantes |
| 22-11-2026 | producción | Despliegue de búsqueda y copias de seguridad y regresión completa | `git push`, `pnpm e2e:prod`, con autorización | 20/20 E2E en producción (incluidas importar → buscar → exportar → reimportar y el resumen con NVIDIA real); 0 filas de prueba restantes |
| 22-11-2026 | producción | Migración `20261123000000_ai_quota` (sha256 `28d82858…`): `ai_usage` + `consume_ai_quota()` | Supabase CLI `db query`, transacción, con autorización | RLS sin políticas; `authenticated`/`anon` sin acceso a la tabla; solo `authenticated` ejecuta la función (`SECURITY DEFINER`); registrada en `schema_migrations` |
| 22-11-2026 | producción | Push a `main` (despliegue en Vercel) y prueba de humo | `git push`, `curl`, `pnpm e2e:prod`, con autorización | Rutas 200; `/api/ai/analyze` 405 en GET y 401 sin sesión; bundle sin secretos; 18/18 E2E. Primera llamada real a NVIDIA: 502 controlado (el modelo razonaba hasta agotar los tokens); corregido desactivando el razonamiento; E2E de resumen con NVIDIA real en verde; 0 filas de prueba restantes |
| 22-11-2026 | producción | E2E remotas tras añadir Evolución (axe y sin scroll horizontal también en `/evolucion`) | `pnpm e2e:remote`, con autorización | 18/18; 0 filas de cuentas de prueba restantes |
| 22-11-2026 | producción | E2E remotas en local con las cuentas sintéticas A/B (18, incluida la nueva de emociones) | `pnpm e2e:remote`, con autorización | 18/18; las entradas de prueba se borran al terminar |
| 10-11-2026 | producción | Prueba de humo sobre `https://florecer-diario.vercel.app` (rutas 200, cabeceras de `vercel.json`, bundle sin secretos, apunta al proyecto correcto) y 17 E2E remotas | `curl`, `pnpm e2e:prod` | 17/17; sin datos sintéticos restantes |

