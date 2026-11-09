# 03 — Fase 1: PMV evaluable el 12 de noviembre de 2026

## Objetivo no negociable

Una persona puede iniciar sesión en un móvil, elegir emoción, guardar su día y comprobar que el registro y color **persisten tras cerrar/abrir el navegador**. Puede consultar y corregir días anteriores. Debe ser operativo en la URL desplegada, no un mock local.

## IN (obligatorio)

**Autenticación**: flujo real de acceso por correo+contraseña con Supabase Auth, cerrar sesión, protección de rutas, estados de error. Para usuaria única, preferir cuenta creada/invitada de forma controlada, registro público deshabilitado en Supabase si no se necesita. Si se habilita registro, confirmar email y verificar flujos, nunca acceso ficticio.

**Hoy**: fecha real local, selector `happy|neutral|sad`, reflexión opcional, logro opcional (campo sencillo), guardar, consultar, editar, carga/error/éxito. `mood` requerido.

**Calendario**: meses reales, lunes a domingo, días coloreados según mood, días vacíos neutros, hoy y seleccionado diferenciados, abrir detalle, crear entradas en días pasados, editar/eliminar con confirmación; bloquear futuras fechas.

**Persistencia**: Supabase `journal_entries`, `user_id`, RLS, clave publishable/anon en navegador, aislamiento entre usuarios probado. Un registro por día. No perder datos al recargar. El resultado no depende del estado temporal en React.

**Responsive**: pantallas principales desde 360px, teclado virtual, navegación inferior móvil, escritorio sin desbordamiento, inputs accesibles.

**Calidad mínima**: validación, errores de red visibles, botón guardar deshabilitado durante petición, no duplicar por doble clic, pruebas básicas de fecha, CRUD y aislamiento RLS.

## OUT (NO programar antes de cerrar fase 1)

NVIDIA, informes IA, estadísticas elaboradas, palabras frecuentes, importación/exportación, recordatorios, cuentas sociales, PWA/offline, gráficos complejos, personalización, markdown editor, búsqueda avanzada, dashboard con datos ficticios en cuentas reales.

## Estados que tienen que existir

- Anónimo/identificándose/identificado/error/caducidad de sesión.
- Día vacío/selección de emoción/draft/no cambios/cargando/guardado/error.
- Calendario sin datos/mes con datos/fecha pasada vacía/día existente/día futuro no editable.
- Pérdida de conexión y reintento; la app conserva texto del formulario mientras está abierta y se comunica que aún NO se guardó.

## Criterios de aceptación demostrables

1. Usuario A guarda feliz + texto + logro para hoy, cierra y abre la web y vuelve a verlo.
2. El calendario colorea correctamente ese día; siguiente mes y mes anterior mantienen coherencia.
3. Modifica texto/mood y hay **una sola fila** para ese usuario/fecha.
4. Crea entrada de ayer desde calendario; no puede crear mañana.
5. Elimina entrada con confirmación; desaparece de calendario y al recargar.
6. Usuario B no puede leer ni alterar ninguna fila de A mediante cliente Supabase ni consultas forzadas.
7. Al fallar la red, no se anuncia guardado exitoso; permite reintento.
8. En móvil estrecho ninguna acción obligatoria queda oculta o imposible de pulsar.
9. No hay datos ficticios ni clave de NVIDIA en el entorno real.
10. Formulario sin emoción no guarda; los campos opcionales pueden estar en blanco.

## Prueba de profesor (guion 90 segundos)

Abrir URL → acceder → seleccionar emoción → escribir reflexión breve no sensible → guardar → calendario coloreado → cambiar mes y volver → recargar → editar → volver a guardar. Utilizar cuenta preparada, sin secretos visibles y sin enseñar escritos personales si no es necesario.

## Cierre de la fase 1

Marcar "GO" únicamente con despliegue funcional, RLS verificado, pruebas pasadas y un registro de prueba recuperable tras cierre. No presentar como terminado si auth o DB son simulados.
