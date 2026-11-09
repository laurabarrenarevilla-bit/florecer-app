# 04 — Fase 2: versión final evaluable el 26 de noviembre de 2026

## Condición de entrada

Fase 1 operativa en producción, sin bloqueadores de guardado/auth/RLS. Nada de añadir IA sobre un diario inestable.

## P1: funciones que aportan nota y uso real

1. **Estadísticas automáticas**: registros por período, distribución de tres emociones, porcentajes con denominador "días registrados", racha actual y racha máxima. Sin "puntuación de felicidad".
2. **Timeline emocional**: últimos 7/30 días o mes con casillas coloreadas; diferenciar ausencia de datos de días tristes.
3. **Palabras recurrentes**: sobre reflexiones escritas de la usuaria, normalización en español, stopwords, conteo real, top N; estado vacío si hay pocos textos.
4. **Logros**: listado y filtros de logros extraídos del campo diario; no hace falta tabla separada.
5. **Historial**: búsqueda de texto local a datos del usuario y filtros por fecha/emoción, edición y eliminación.
6. **Copias de seguridad**: exportar JSON descargable real e importar con validación, vista previa y política de conflictos, comprobando resultados tras recarga.
7. **Análisis IA**: seleccionar registros, previsualizar **texto completo**, excluir, confirmar envío; endpoint seguro NVIDIA + respuesta estructurada validada, errores y reintentos. Alternativa de copiar texto sin envío automático.
8. **Ajustes**: privacidad exacta, descarga, importación, cierre sesión; opciones visibles solo si hacen algo real; borrado completo opcional pero, si se muestra, debe funcionar con doble confirmación.

## P2: solo si hay tiempo y motivo de uso real

Onboarding mínimo, accesibilidad avanzada, preferencias de animación reales, instalación PWA sin prometer offline, mayor cobertura de pruebas, mejora de calendarios accesibles, filtros elegidos por usuaria.

## Exclusiones de fase 2

Chat libre persistente con IA, análisis automático nocturno, notificaciones, gamificación, cuentas sociales, identificación de patologías, panel de administración, local-first sync bidireccional complejo, datos de terceros.

## Criterios de aceptación

- Estadísticas concuerdan exactamente con fixtures de prueba y cambian al editar/eliminar.
- El usuario puede copiar un prompt con solo entradas seleccionadas; ninguna petición NVIDIA en ese flujo.
- Para IA: confirmar envío desencadena petición autenticada, salida validada y marca de que es orientativa; cancelar no realiza petición.
- API NVIDIA key nunca aparece en bundle, red navegador, variables Vite o logs.
- Exportar produce JSON real sin secretos/tokens y reimportar en cuenta de prueba reproduce entradas sin duplicados involuntarios.
- Errores (NVIDIA caído, datos insuficientes, JSON corrupto, sesión caducada) se gestionan con mensajes útiles sin inventar éxito.
- Se ha utilizado realmente desde el teléfono antes de la entrega, con entrada(s) voluntarias; se documentan mejoras vinculadas al uso, no narrativas inventadas.
- El flujo completo fase 1 sigue pasando tras cambios de fase 2.

## Priorización si aparece bloqueo

Persistencia y seguridad > uso real > backup > estadísticas > IA avanzada > mejoras cosméticas. Reducir alcance antes que simular una función o introducir una brecha de privacidad.
