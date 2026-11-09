# Índice y precedencia documental

## Lectura requerida para agentes

1. `/CLAUDE.md` (con `/AGENTS.md` como symlink): reglas de ejecución, restricciones y fuentes de verdad.
2. `01-PRODUCT.md`: objetivo, alcance, perfiles y requisitos de negocio.
3. `02-ARCHITECTURE.md`: decisiones técnicas, capas, rutas y dependencias.
4. `03-MVP-PHASE1.md`: contrato exacto de la primera entrega.
5. `04-FINAL-PHASE2.md`: contrato exacto de la segunda entrega.
6. `05-DATA-AND-SUPABASE.md`: esquema, políticas RLS, migraciones y consultas.
7. `06-DESIGN-AND-SASS.md`: diseño, tokens, responsive y reglas 7-1.
8. `07-AUTH-AND-SECURITY.md`: autenticación, seguridad, privacidad, modelo de amenazas.
9. `08-AI-NVIDIA.md`: análisis, consentimiento, API privada y salvaguardas.
10. `09-IMPLEMENTATION-PLAN.md`: tareas ordenadas y puertas de calidad.
11. `10-TEST-PLAN.md`: matriz de pruebas y criterios de aceptación.
12. `11-INFRA-AND-DEPLOYMENT.md`: entornos, configuración, CI, operación.
13. `12-BACKUP-AND-PORTABILITY.md`: formato JSON, importación y eliminación.
14. `13-ANALYTICS-AND-DATE-LOGIC.md`: estadísticas, fechas y fórmulas.
15. `14-USER-FLOWS.md`: navegación, estados y contratos UX.
16. `15-DECISIONS-AND-RISKS.md`: ADRs y riesgos.
17. `16-EVALUATION-AND-CHANGELOG.md`: evidencias para el profesor y mejoras reales.
18. `17-API-AND-ERROR-CONTRACTS.md`: tipos, endpoints, errores y límites.
19. `18-OPERATIONS-AND-RECOVERY.md`: incidentes, restauración y procedimientos.
20. `references/`: prototipo de Claude Design como referencia, no implementación.

## Precedencia

- En seguridad/privacidad mandan `07`, `08`, `12` y las reglas del agente.
- En datos y semántica mandan `05`, `13`, `17`.
- En entrega y prioridad mandan `03`, `04`, `09`.
- En diseño manda `06` y el prototipo como **guía de composición**, nunca como fuente de lógica.
- La estructura `src/sass/` que **exista realmente en el repositorio** tiene prioridad frente a ejemplos de estructura de este paquete.
- Si dos documentos discrepan, comunicar la discrepancia y registrar una decisión; no asumir silenciosamente.

## Definiciones

- **MVP/PMV:** primera versión real, persistente y usable, no una maqueta.
- **Final:** fase 1 consolidada más mejoras útiles y verificables.
- **Datos reales:** anotaciones voluntarias de la usuaria; no fabricar entradas para obtener puntuación.
- **Prototipo:** referencia visual con estados falsos.
- **RLS:** Row Level Security; defensa de autorización en PostgreSQL/Supabase.

## No decidido por falta de repositorio/configuración

Versiones concretas de paquetes, nombre real de los parciales SASS, IDs de Supabase, cuentas, proyecto Vercel, URL/dominio y modelo NVIDIA. El agente debe inspeccionar, seleccionar versiones compatibles y dejar constancia, sin inventar credenciales ni archivos preexistentes.
