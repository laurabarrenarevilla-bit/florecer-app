-- VUELTA ATRÁS de 20261123000000_ai_quota.sql
--
-- Elimina la cuota del análisis con IA. La tabla solo contiene marcas de uso
-- (quién y cuándo), sin contenido del diario. Antes, retirar o desactivar el
-- endpoint /api/ai/analyze: sin la función de cuota responde con error.
-- Requiere autorización expresa de la propietaria del proyecto.

begin;

drop function if exists public.consume_ai_quota();
drop table if exists public.ai_usage;

commit;
