# 17 — Contratos de interfaces, validación y manejo de errores

## Tipos TypeScript orientativos

```ts
type Mood = 'happy' | 'neutral' | 'sad';
type LocalDate = `${number}-${number}-${number}`; // validar realmente YYYY-MM-DD
interface JournalEntry {
  id: string;
  userId: string;
  date: LocalDate;
  mood: Mood;
  reflection: string;
  achievement: string;
  createdAt: string;
  updatedAt: string;
}
interface SaveJournalEntryInput {
  date: LocalDate;
  mood: Mood;
  reflection: string;
  achievement: string;
}
```

No confiar en el literal `LocalDate` como validador: usar Zod/función fecha real; no admitir 2026-02-31 ni cadena futura. Sanitizar solo con reglas estables: `trim()` según producto, máximo reflexión 5000, logro 500, no borrar intencionadamente saltos de línea de un diario.

## Contrato Repository

```ts
interface JournalRepository {
  listBetween(from: LocalDate, to: LocalDate): Promise<JournalEntry[]>;
  getByDate(date: LocalDate): Promise<JournalEntry | null>;
  save(input: SaveJournalEntryInput): Promise<JournalEntry>;
  deleteByDate(date: LocalDate): Promise<void>;
  listAllPaginated(): Promise<JournalEntry[]>;
}
```

Puede ajustarse a la implementación real, pero no mezclar Supabase calls directamente en la UI de cada página.

## Errores de dominio

- `AUTH_REQUIRED`: sesión no válida o expiró.
- `PERMISSION_DENIED`: intento de objeto ajeno (no revelar existencia).
- `VALIDATION_ERROR`: campo/rango/tamaño incorrecto.
- `ENTRY_CONFLICT`: edición simultánea o duplicado.
- `NETWORK_UNAVAILABLE`: petición fallida, mantener borrador.
- `DB_UNAVAILABLE`: backend no disponible, reintentar.
- `AI_NO_ENTRIES`: nada elegido o sin texto.
- `AI_CONSENT_REQUIRED`: confirmación ausente.
- `PREVIEW_STALE`: entradas cambiaron desde revisión.
- `AI_RATE_LIMIT`: límite alcanzado.
- `AI_UNAVAILABLE` / `AI_INVALID_RESPONSE` / `AI_TIMEOUT`: errores externos, no filtrar secreto.
- `BACKUP_INVALID`: archivo no cumple schema.
- `BACKUP_CONFLICT`: duplicados con la cuenta.

## Respuestas de `POST /api/ai/analyze`

Éxito HTTP 200: `{ "data": { "summary": "...", "recurringThemes": [], "achievements": [], "reflectionQuestions": [], "suggestedActions": [], "disclaimer": "..." }, "meta": { "entryCount": 2 } }`.

Error estructurado: `{ "error": { "code": "PREVIEW_STALE", "message": "Tus entradas han cambiado. Revísalas antes de analizar." } }`.

HTTP 400 campos, 401 sesión, 403 permiso, 409 previsualización antigua, 413 tamaño, 429 cuota, 502 proveedor/output, 504 timeout. No retornar stacktrace, prompts ni respuestas en bruto del proveedor.

## Límites

- Fecha válida y <= hoy local.
- Una entrada por fecha/usuario.
- Longitudes UI/API/DB consistentes.
- IA 1-30 entradas, 20k caracteres total máximo y max 10 usos/día por usuario si se activa cuota persistente.
- Importar archivo máximo acordado (ej. 5 MiB) y máximo de entradas acorde a cuotas, con mensaje si excede.

## Request lifecycle

`idle → validating → loading → success/error`. Las mutaciones no dan éxito antes del servidor. Reintentos de escritura deben ser idempotentes respecto a `(user_id,entry_date)`, pero evitar reintento automático agresivo de operaciones destructivas. Mapear errores técnicos a mensajes comprensibles y no filtradores.
