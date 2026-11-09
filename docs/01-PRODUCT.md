# 01 — Producto, alcance y reglas de negocio

## Propósito

Florecer es un diario personal para registrar cómo se siente una persona, conservar pequeñas reflexiones y logros, consultar su calendario emocional y, en fase 2, explorar tendencias y generar preguntas de reflexión con IA. **No es terapia, diagnóstico, evaluación clínica ni herramienta de productividad intensiva**.

## Problema

Sin un registro sencillo, recordar cómo se ha sentido durante varias semanas, sus pequeños progresos y temas recurrentes exige esfuerzo y releer numerosas notas. Florecer convierte un hábito de 2-5 minutos en historial recuperable y estadísticas sin mecanizar el bienestar.

## Usuario y contexto

Uso inicial individual por una estudiante, principalmente desde el móvil, en español de España. Crece técnicamente a múltiples cuentas sin añadir funciones multiusuario sociales. La usuaria vive con sus padres y estudia, pero la aplicación no debe hardcodear biografía ni nombre: saludo neutro o nombre configurable, nunca asumir "Laura" en producción.

## Flujos esenciales

1. Autenticarse en cuenta privada.
2. Abrir Hoy; seleccionar un estado: `happy` (Feliz, amarillo), `neutral` (Normal, naranja), `sad` (Triste, azul).
3. Escribir reflexión opcional y logro opcional; guardar.
4. Revisar su entrada, editarla y volver a guardarla sin duplicarla.
5. Explorar meses, abrir días pasados, crear/editar/eliminar entradas pasadas; prohibir fechas futuras.
6. En fase 2, ver distribución emocional, rachas, palabras recurrentes y logros.
7. En fase 2, seleccionar entradas de texto, revisar qué se compartirá, consentir envío puntual a NVIDIA o copiar para análisis manual.
8. En fase 2, exportar e importar copia JSON de forma segura.

## Reglas de negocio estables

- Una entrada por `(user_id, entry_date)`.
- El estado emocional es obligatorio para guardar. Reflexión y logro opcionales, se pueden dejar vacíos.
- La ausencia de registro no implica tristeza, incumplimiento ni pérdida de valor.
- Un estado triste es tan válido como uno feliz; nada de puntuación de bienestar ni penalizaciones.
- El usuario puede añadir retrospectivamente entradas, hasta hoy inclusive; no crear entradas futuras.
- La fecha del diario es **fecha civil local**, no timestamp del instante de edición.
- Se guarda solamente contenido elegido conscientemente; no autogenerar entradas reales.
- No mostrar gráficos o análisis con datos ficticios en cuentas reales.
- El uso continuado no requiere análisis de IA ni servicios extra.

## Fuera de alcance general

Red social, comentarios públicos, perfiles sociales, seguimiento psicológico, análisis clínico, notificaciones push, retos obligatorios, gamificación competitiva, reconocimiento de emociones por cámara/voz, ads, pagos, chat conversacional persistente, multi-organización, CMS, contenidos de marketing o integraciones sanitarias.

## Objetivos de calidad

- Registro del día en tres acciones mínimas: abrir, seleccionar emoción, guardar.
- Feedback claro de persistencia y errores, sin pérdida silenciosa de texto.
- Interfaz legible en 360px, teclado y lector de pantalla; desktop igualmente usable.
- Control de privacidad y posibilidad de copia local.
- Minimizar datos: solo los imprescindibles para el producto.

## Evaluación académica

PMV 3 puntos: función principal operativa. Final 7: funcionamiento 2, mejoras razonadas 3, uso real 2. Registrar evidencia verificable sin compartir con terceros reflexiones privadas (usar datos agregados, ocultar o redactar contenido si el profesor solo necesita ver la herramienta).
