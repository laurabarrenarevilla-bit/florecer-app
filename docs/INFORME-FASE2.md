# Florecer: informe de la entrega final (fase 2)

**Aplicación:** https://florecer-diario.vercel.app · **Entrega:** 26 de noviembre de 2026

> Las partes entre corchetes [así] las tiene que completar la autora con datos de su uso real antes de entregar. No se han inventado.

## 1. Problema y usuaria

Llevar un diario emocional en papel o en notas sueltas cuesta: es difícil recordar cómo te sentiste hace tres semanas, qué pequeños logros tuviste o qué temas se repiten. Florecer convierte un hábito de 2–5 minutos al día en un historial que se puede consultar y en estadísticas sencillas.

La usuaria principal es una estudiante que la usa sobre todo desde el móvil, en español. Florecer **no es una herramienta de terapia ni de diagnóstico**: no evalúa a nadie y no promete certezas sobre las emociones.

## 2. Qué se enseñó en la fase 1 (12-11)

Un PMV real, desplegado y con datos persistentes:

- Registro público e inicio de sesión con correo y contraseña (Supabase Auth). También se puede eliminar la cuenta.
- **Hoy:** elegir cómo te has sentido (Feliz, Normal o Triste; obligatorio), una reflexión y un logro opcionales, y guardar, consultar y editar el registro.
- **Calendario:** meses reales con cada día coloreado según el ánimo. Se pueden crear, editar y eliminar días pasados, con confirmación. Los días futuros no se pueden registrar.
- Datos en PostgreSQL con seguridad por filas (RLS): cada cuenta solo puede leer y modificar lo suyo, y está comprobado con dos cuentas de prueba.
- Diseño pensado para móvil (desde 360 px) e instalable como aplicación (PWA), sin guardar datos personales en caché.

## 3. Feedback del profesor y qué se hizo

| Feedback | Qué se ha hecho | Dónde verlo |
|---|---|---|
| **Identificar patrones** | Observaciones calculadas a partir de los registros. Por ejemplo: «Los lunes registraste sobre todo "Triste": 3 de 4», el ánimo y la emoción más frecuentes, la racha más larga y los días con logro. Solo aparecen con al menos 5 días registrados, nombran los empates y no valoran ni diagnostican. | Evolución → Patrones |
| **Preguntas de introspección** | Encima de la reflexión aparece una pregunta orientativa («¿Qué te ha dado energía hoy?») con un botón «Otra pregunta». Son 15 preguntas fijas: no usan IA ni presuponen cómo te sientes. | Hoy |
| **Ver anual/semanalmente** | La página Evolución tiene vista de semana, mes y año, con navegación al periodo anterior y al siguiente. | Evolución |
| **«Quesito» de emociones a lo largo del tiempo** | Un gráfico de anillo con el reparto de ánimos, una franja diaria de colores (semana y mes) y barras apiladas por mes (año). Los datos también aparecen en texto. | Evolución |
| **Emociones dentro de cada principal** | Después de elegir el ánimo se pueden marcar hasta 3 emociones concretas de su grupo, basadas en la rueda de Plutchik. Por ejemplo, Tristeza → melancolía, decepción, remordimiento, miedo, enfado, asco. La base de datos rechaza emociones que no correspondan al ánimo. | Hoy, Calendario y Evolución |
| **Guardar sin conexión y subir después** | **No implementado** (ver §8). Lo que sí funciona: si no hay red, lo escrito se conserva en pantalla, no se anuncia un guardado falso y se puede reintentar. | — |

## 4. Otras mejoras de la fase 2

Para cada mejora: qué necesidad cubre, qué se hizo y cómo se ha probado.

- **Estadísticas reales**
  - *Necesidad:* ver la evolución sin hacer cuentas a mano.
  - *Mejora:* días registrados, porcentajes por ánimo, racha actual y racha más larga, comparación con el periodo anterior (solo cantidades y porcentajes, sin «mejor» ni «peor») y palabras que más usas.
  - *Prueba:* tests con datos de prueba conocidos, incluidos cambios de mes y de año, año bisiesto y cambio de hora.
- **Resumen semanal con IA (NVIDIA)**
  - *Necesidad:* releer la semana con otra mirada.
  - *Mejora:* las cifras las calcula la aplicación y la IA solo redacta el resumen, los temas, las preguntas y pequeños pasos.
    - Antes de enviar se ve **el texto completo** de cada entrada, se eligen una a una y se confirma.
    - La clave de NVIDIA solo está en el servidor.
    - La respuesta se valida antes de mostrarla.
    - Hay un límite de 1 resumen por minuto y 10 al día por persona.
    - Nada de esto se guarda.
    - Alternativa sin enviar datos: **«Copiar para ChatGPT»**.
  - *Prueba:* 23 tests de la función sin red y una prueba de extremo a extremo con NVIDIA real usando una cuenta y un texto sintéticos.
- **Búsqueda**
  - *Necesidad:* encontrar un día concreto sin ir mes a mes.
  - *Mejora:* busca en reflexiones, logros y emociones sin tener en cuenta tildes ni mayúsculas, con filtros por ánimo, por fechas y por «solo días con logro».
- **Copia de seguridad**
  - *Necesidad:* tener una copia propia de los datos.
  - *Mejora:* exportar todo a JSON (con aviso de que el archivo no está cifrado) e importar con vista previa. La importación **nunca sobrescribe** días ya registrados.
  - *Prueba:* exportar → importar → reimportar sin duplicados, contra la base de datos real con una cuenta de prueba.

## 5. Uso real

[Completar con datos agregados, sin copiar reflexiones:
- desde qué fecha se usa y en qué dispositivo;
- número aproximado de días registrados;
- qué se aprendió usándola (qué resultó útil, qué molestó) y qué se cambió por ello.]

## 6. Seguridad y almacenamiento

- Los datos están en Supabase (PostgreSQL en la nube) y protegidos con RLS por usuario. Los permisos van por columna: el navegador nunca puede cambiar a quién pertenece una entrada.
- En el navegador solo está la clave pública de Supabase. La clave de NVIDIA vive en la función del servidor, y se ha comprobado en cada despliegue que el código publicado no contiene secretos.
- La IA solo recibe lo que la persona elige y confirma. El servidor vuelve a leer las entradas con los permisos de esa persona y rechaza la petición si cambiaron desde la vista previa. Los registros del servidor no contienen textos, claves ni tokens.
- Validación en tres capas, formulario, servidor y base de datos, con las mismas reglas.
- Se informa con honestidad: el diario está en la nube y el archivo de copia no está cifrado. No se promete una privacidad absoluta.

## 7. Pruebas y fallos encontrados

**Pruebas automáticas (22-11-2026):**

| Tipo | Resultado |
|---|---|
| Unitarias y de interfaz (Vitest + Testing Library), incluida accesibilidad con axe | 232 / 232 |
| Base de datos con las migraciones reales (PostgreSQL local, dos usuarios) | 18 / 18 |
| E2E en navegador sin servidor (rutas públicas, PWA, contraste) | 32 / 32 |
| E2E contra la aplicación publicada y la base de datos real, con cuentas sintéticas | 20 / 20 |

Cada prueba que escribe en producción usa cuentas sintéticas y borra sus datos al terminar; se comprobó que no quedaba ninguna fila.

**Fallos encontrados y corregidos durante la fase 2:**

- **Resumen de IA vacío en producción:** el modelo configurado «razonaba» hasta agotar el límite de texto y no llegaba a responder. La aplicación mostró un error controlado, nunca un resultado inventado. Se corrigió desactivando el razonamiento: ahora responde en unos 1–2 s.
- **Comparación mal etiquetada:** al ver un mes pasado, la tabla decía «este mes». Ahora muestra el nombre real del periodo.
- **En móvil, la pregunta de introspección quedaba encajonada** junto a su botón. Ahora el botón va debajo.
- **Estilos:** los botones Semana/Mes/Año aparecían con los bordes por defecto del navegador. Corregido.

## 8. Limitaciones

- **No hay modo sin conexión con sincronización posterior.** Sincronizar sin perder ni duplicar entradas, por ejemplo al editar desde dos dispositivos, no se podía hacer con garantías en el plazo. Queda como mejora futura.
- **El resumen con IA cubre solo los últimos 7 días** y no se guarda.
- **Las palabras frecuentes no hacen análisis morfológico:** «río» (sustantivo) y «rio» (verbo) se cuentan juntas.
- **Sin recuperación de contraseña por correo:** el proyecto usa el plan gratuito de Supabase sin servicio de correo propio. Se avisa al crear la cuenta.
- **Pendiente:** la instalación como aplicación está probada en navegador; falta probarla en Android e iOS reales.
