# ADR-010: PWA instalable con caché estática

Fecha: 10-11-2026. Solicitada expresamente por el usuario como mejora de fase 2.

## Decisión

Mantener React/Vite/Supabase y añadir `vite-plugin-pwa` 2 con `generateSW`.
Conservar `public/favicon/site.webmanifest` como única fuente del manifest:
`id`, `scope` y `start_url` explícitos en `/`, idioma `es-ES`, modo `standalone`.
El router existente lleva a Hoy o Acceso según la sesión.

Se conserva la estructura real de `src/sass/`, sus siete categorías, los tokens
y el único entrypoint `src/sass/main.scss`. La nueva UI usa Button/InlineAlert
y un parcial en components. No se han detectado divergencias que requieran
reorganizar la arquitectura de `docs/02` o los estilos de `docs/06`.

## Instalación y conectividad

- Ajustes ofrece el diálogo nativo solo cuando el navegador entrega
  `beforeinstallprompt`. Se conserva el evento desde el arranque y se consume
  una sola vez. Cancelar o fallar deja instrucciones útiles.
- iPhone/iPad: instrucciones para Safari y pantalla de inicio. Modo standalone
  o evento `appinstalled`: se oculta la invitación.
- El worker solo se registra en builds de producción; no en `vite dev`.
- Se precachean HTML estático, JS (incluidos módulos lazy), CSS, fuentes locales
  e iconos. No hay runtime caching, persistencia de consultas ni cola offline.
- El fallback de navegación excluye API, assets, favicon y rutas de archivos.
- Supabase Auth/REST/RPC y futuras API siguen dependiendo de la red. La sesión
  conserva su persistencia actual; entradas y borradores no se añaden a disco.
- Sin conexión puede abrirse la interfaz tras una primera carga e instalación
  de la caché correctas. Esto no permite consultar el historial ni guardar sin
  Supabase. Los borradores siguen perdiéndose al cerrar/recargar la ventana.

## Actualizaciones

Sin `autoUpdate`, `clientsClaim` ni recargas automáticas. El worker nuevo espera
y la UI permite "Actualizar" o "Más tarde". Hay bloqueo con borradores de
cualquier pantalla, mutaciones activas u operaciones marcadas `aria-busy`.
Antes de la recarga se comprueba de nuevo si se ha empezado a escribir.

El pequeño script importado `public/pwa-lifecycle.js` tramita
`ACTIVATE_IF_SINGLE_CLIENT`: comprueba los clientes de tipo ventana (también
los no controlados) y solo llama a `skipWaiting()` cuando no hay otra ventana.
Esto evita reemplazar la precaché usada por otra ventana abierta. La página
recarga únicamente tras confirmar activación; no envía textos ni credenciales
en los mensajes del worker. Si se abren ventanas durante la comprobación y la
activación existe una carrera residual: no hay una transacción del navegador
que bloquee la apertura de ventanas. No se promete protección absoluta.

Los fallos de registro no bloquean el diario. Volver del segundo plano intenta
comprobar actualizaciones. Si no hay red, se volverá a comprobar más adelante.

## Despliegue y recuperación

Vercel mantiene CSP con `worker-src 'self'`, revalidación de `sw.js`, del script
de ciclo de vida y del manifest, tipo MIME del manifest e inmutabilidad de assets
con hash. El fallback SPA no debe sustituir workers/API/assets ausentes por HTML.
Verificar cabeceras, MIME y rutas en HTTPS tras el despliegue autorizado.

Una reversión de archivos no desinstala automáticamente workers existentes.
Para retirar la PWA: preparar una publicación que quite el registro del cliente
y sirva un worker de retirada en la misma URL `/sw.js`. Ese worker debe activar,
eliminar exclusivamente cachés con prefijo `florecer`, y desregistrarse. Mantener
su URL disponible durante la transición. No borrar todo el almacenamiento del
origen: contiene la sesión. No forzar recargas sobre formularios. Probar el retiro
en un origen aislado antes de publicarlo; no se ha ejecutado en producción.

## Alternativas y límites

- Solo manifest: suficiente para algunos flujos de instalación, pero sin arranque
  controlado sin red ni gestión de versiones.
- Worker completamente manual / `injectManifest`: innecesario para una precaché
  estática; solo se mantiene el pequeño guard de activación entre ventanas.
- Diario offline con IndexedDB y sincronización: fuera del alcance autorizado;
  exigiría otro diseño de privacidad, conflictos y persistencia.

La fase 1 sigue necesitando su smoke pendiente en móvil real sobre el dominio
desplegado. Esta mejora no declara "GO" de producción ni autoriza despliegues.

## Verificación

- Tests de componentes: oferta de instalación previa a Ajustes, aceptación,
  cancelación/error, instrucciones iOS, appinstalled, borradores, operaciones,
  aplazamiento y estado de conexión.
- Playwright en Chromium móvil/escritorio sobre build real: manifest e iconos,
  worker activo, arranque sin red, caché solo de recursos públicos, dos versiones
  de worker y dos ventanas. La nueva versión se simula cambiando los bytes del
  worker compilado; no son dos compilaciones funcionalmente diferentes.
- Cuenta y API sintéticas interceptadas localmente: borrador bloquea actualización
  desde Hoy y Ajustes, se conserva tras aplazar, axe y ausencia de desbordamientos.
- Pendiente en dispositivos: instalación nativa Android/iOS, recorte adaptativo,
  sesión standalone, teclado y actualización de una publicación HTTPS a otra.

Fuentes: [Vite PWA](https://vite-pwa-org.netlify.app/guide/),
[actualizaciones con aviso](https://vite-pwa-org.netlify.app/guide/prompt-for-update.html),
[Vercel](https://vite-pwa-org.netlify.app/deployment/vercel),
[criterios de instalación](https://web.dev/articles/install-criteria).

## Revisión (10-11-2026, tras el despliegue en florecer-diario.vercel.app)

Comprobado en producción, en Chromium real con una cuenta sintética:

- **Caché:** una sola caché `florecer-precache-v2` con 29 recursos públicos del build (html, js, css, fuentes, iconos y manifest). Ninguna URL externa, ninguna respuesta de Supabase (REST/Auth) y ningún texto del diario, después de iniciar sesión y guardar una entrada. `localStorage` solo contiene el token de sesión de Supabase, igual que sin PWA.
- **Cabeceras:** `sw.js`, `pwa-lifecycle.js` y el manifest con `no-cache`; MIME correctos; CSP con `worker-src 'self'`; `workbox-*.js` revalidado.
- **Sin conexión:** la interfaz abre desde la caché y no muestra datos antiguos. Sí había un problema, ajeno al worker: Hoy tardaba ~16 s («Cargando tu día…», 8 peticiones fallidas) en avisar, porque postgrest-js reintenta cada lectura 3 veces y React Query añadía otro reintento. Corregido: el repositorio falla al momento si `navigator.onLine === false` y React Query ya no reintenta fallos de red. Ahora el aviso es inmediato.
- **Hallazgo menor:** el worker generado por Workbox incluye además su receptor estándar del mensaje `SKIP_WAITING`, que activaría la versión nueva sin pasar por la comprobación de una sola ventana. La aplicación no envía ese mensaje y solo pueden enviarlo páginas del mismo origen. Se deja anotado; eliminarlo exigiría pasar a `injectManifest`.
- **Retirada:** el procedimiento está descrito arriba, pero el worker de retirada no está preparado. Si hubiera que quitar la PWA, primero hay que crearlo y probarlo en un origen aislado.
- **Alcance:** CLAUDE.md excluye la PWA y el modo sin conexión de la fase 1. Esta mejora se pidió expresamente (ver «Fecha»), ya está en producción y no guarda datos personales en disco.
