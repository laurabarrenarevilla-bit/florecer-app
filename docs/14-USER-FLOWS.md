# 14 — Flujos UX, pantallas y estados

## Mapa de rutas

- `/` → auth guard redirige a `/hoy` o `/login`.
- `/login`: acceso; registro/cambio contraseña solo si habilitados.
- `/hoy`: entrada del día y edición.
- `/calendario`: vista mensual y lista/historial.
- `/evolucion`: fase 2, análisis y estadísticas.
- `/ajustes`: fase 2 completa, fase 1 puede contener solo sesión/privacidad básica.
- `*`: página no encontrada con acción de retorno.

## Onboarding

Una pantalla breve, optativa, antes de la primera entrada; sin bloquear acceso repetido y sin preguntas largas. Estado guardado en preferencia no sensible, no en un flujo de login ficticio.

## Registrar hoy

Nuevo día → emoción requerida → reflexión/logro opcionales → validar → guardar (loading) → DB éxito → vista de resumen + calendario actualizado. Error → feedback y reintento, manteniendo campos. Editar reabre datos reales y cancelar revierte borrador local.

Fase 2 (ADR-011):
- **Emociones secundarias.** Al elegir un ánimo aparecen sus emociones como chips seleccionables (`aria-pressed`, 44 px como mínimo). Se pueden marcar hasta 3; al llegar a la tercera, las demás quedan deshabilitadas y un texto lo explica. Si se cambia de ánimo, se quitan las emociones del grupo anterior. El detalle del día y el resumen de Hoy muestran las emociones marcadas.
- **Preguntas de introspección.** Sobre el campo de reflexión aparece una pregunta orientativa y un botón "Otra pregunta". No se guarda y no bloquea nada.

## Calendario

Cambiar mes, revisar fecha, crear si fecha pasada vacía, mostrar detalle si existe, modificar/borrar con confirmación. Días futuros son visibles pero no editables. Leyenda siempre clara, accesibilidad de celdas con fecha completa y estado. Mes vacío no debe parecer app rota.

## Historial

Lista ordenada desc, búsqueda y filtros por estado; lista vacía si no hay registros y mensaje diferente si la búsqueda no coincide. Para primera fase puede ser solo el detalle del calendario.

## Evolución

Período semana/mes/año (22-11, sustituye a 7/30/mes) con anterior/siguiente, gráfico de anillo por ánimo, franja diaria, comparación con el período anterior, patrones descriptivos, emociones secundarias más frecuentes y lista de logros; números calculados. Sin entradas, mostrar empty state con CTA a Hoy; no generar gráficos ficticios. Tocar un día lleva a su registro.

## IA

Abrir → período → lista de entradas con reflexión → elegir inclusiones → expandir texto completo/editar selección → consentimiento → envío → loading/error/resultado; alternativa copiar. No afirmar haber recibido resultado de NVIDIA en fase de prototipo. Al cambiar selección invalidar cualquier consentimiento anterior para evitar accidental envío.

## Ajustes

Cuenta; explicaciones de privacidad; export/import y eliminación solo si reales; feedback de éxito o error verificable. Cerrar sesión siempre operativo. No prometer sincronización offline ni cifrado E2E si no implementado.

## Estados globales

Loading sesión; error Supabase; error conexión; invalid input; disabled submit; no datos; retry; confirm borrado; modal keyboard/focus; mensaje éxito solo tras backend; texto del usuario nunca borrado por error de red.

## Copy de errores orientativo

- Guardado fallido: "No hemos podido guardar tu día. Lo que has escrito sigue aquí. Inténtalo otra vez."
- Sesión caducada: "Tu sesión ha terminado. Inicia sesión para continuar."
- Sin registros: "Aún no hay entradas este mes. Puedes empezar cuando te apetezca."
- IA insuficiente: "Necesitamos al menos una reflexión escrita para preparar el análisis."
- IA no disponible: "No hemos podido preparar el análisis. Tus registros siguen guardados."
