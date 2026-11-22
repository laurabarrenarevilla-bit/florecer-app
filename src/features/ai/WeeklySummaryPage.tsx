import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useEntriesBetween } from '@/features/journal/queries.ts'
import { EMOTION_LABELS } from '@/features/journal/emotions.ts'
import { MOOD_LABELS, MOODS } from '@/features/journal/mood.ts'
import type { JournalEntry } from '@/features/journal/types.ts'
import { summarize } from '@/features/evolution/stats.ts'
import { addCalendarDays, formatLongDate, type LocalDate } from '@/shared/lib/dates.ts'
import { ERROR_MESSAGES, isAppError } from '@/shared/lib/errors.ts'
import { useToday } from '@/shared/lib/useToday.ts'
import { Button } from '@/shared/ui/Button.tsx'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog.tsx'
import { EmptyState } from '@/shared/ui/EmptyState.tsx'
import { InlineAlert } from '@/shared/ui/InlineAlert.tsx'
import { LoadingState } from '@/shared/ui/LoadingState.tsx'
import { PageHeading } from '@/shared/ui/PageHeading.tsx'
import { AiError, createAiClient, type AiClient } from './aiClient.ts'
import { buildChatGptText } from './chatgptText.ts'
import type { Analysis } from './schema.ts'

const defaultClient = createAiClient()
const STALE = 'preview-stale'

function hasText(entry: JournalEntry): boolean {
  return entry.reflection.trim() !== '' || entry.achievement.trim() !== ''
}

type SendState =
  | { status: 'idle' }
  | { status: 'confirming' }
  | { status: 'sending' }
  | { status: 'error'; message: string; key: string }
  | { status: 'done'; analysis: Analysis; key: string }

/**
 * Resumen de la semana (fase 2, docs/08). Los recuentos los calcula el código;
 * la IA solo redacta. Nada sale del navegador sin vista previa íntegra,
 * selección explícita y confirmación. "Copiar para ChatGPT" no hace peticiones.
 */
export function WeeklySummaryPage({ client = defaultClient }: { client?: AiClient }) {
  const today = useToday()
  const from: LocalDate = addCalendarDays(today, -6)
  const query = useEntriesBetween(from, today)
  const entries = useMemo(() => [...(query.data ?? [])].sort((a, b) => b.date.localeCompare(a.date)), [query.data])
  const summary = useMemo(() => summarize(entries, 7), [entries])

  // Selección: por defecto, las entradas con texto. Se guarda por id + versión:
  // si una entrada cambia, deja de estar marcada y hay que revisarla de nuevo.
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(new Set())
  const versionKey = (e: JournalEntry) => `${e.id}@${e.updatedAt}`
  const selected = entries.filter((e) => hasText(e) && !excluded.has(versionKey(e)))
  const selectedKey = selected.map(versionKey).join('|')

  const [rawSend, setSend] = useState<SendState>({ status: 'idle' })
  const [rawCopy, setCopy] = useState<{ status: 'copied' | 'manual'; key: string } | null>(null)
  const resultRef = useRef<HTMLElement>(null)

  // Un resultado, error o copia solo vale para la selección con la que se hizo:
  // al cambiar la selección deja de mostrarse y hay que repetir la acción.
  // Excepción: el aviso de "tus entradas han cambiado" (clave STALE) sigue visible tras recargarlas.
  const send: SendState = 'key' in rawSend && rawSend.key !== selectedKey && rawSend.key !== STALE ? { status: 'idle' } : rawSend
  const copyState = rawCopy && rawCopy.key === selectedKey ? rawCopy.status : 'idle'

  useEffect(() => {
    if (rawSend.status === 'done') resultRef.current?.focus()
  }, [rawSend])

  const toggle = (entry: JournalEntry) => {
    setExcluded((current) => {
      const next = new Set(current)
      const key = versionKey(entry)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const chatGptText = buildChatGptText(selected)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(chatGptText)
      setCopy({ status: 'copied', key: selectedKey })
    } catch {
      setCopy({ status: 'manual', key: selectedKey })
    }
  }

  const confirmSend = async () => {
    const key = selectedKey
    setSend({ status: 'sending' })
    try {
      const analysis = await client.analyzeWeek(selected.map((e) => ({ id: e.id, updatedAt: e.updatedAt })))
      setSend({ status: 'done', analysis, key })
    } catch (error) {
      const message = error instanceof AiError ? error.message : 'No hemos podido preparar el resumen. Tus registros siguen guardados.'
      const stale = error instanceof AiError && error.code === 'PREVIEW_STALE'
      setSend({ status: 'error', message, key: stale ? STALE : key })
      if (stale) void query.refetch()
    }
  }

  return (
    <section className="page weekly-summary">
      <PageHeading
        eyebrow={<Link to="/evolucion">← Tu evolución</Link>}
        title="Resumen de la semana"
        lead={`Del ${formatLongDate(from)} al ${formatLongDate(today)}.`}
        documentTitle="Resumen de la semana"
      />

      {query.isPending ? (
        <LoadingState label="Cargando tu semana…" />
      ) : query.isError && query.data === undefined ? (
        <InlineAlert
          tone="error"
          actions={
            <Button variant="secondary" onClick={() => void query.refetch()} isLoading={query.isFetching} loadingText="Reintentando…">
              Reintentar
            </Button>
          }
        >
          No hemos podido cargar tu semana. {isAppError(query.error) ? query.error.message : ERROR_MESSAGES.UNKNOWN}
        </InlineAlert>
      ) : entries.length === 0 ? (
        <EmptyState
          title="Aún no hay registros en los últimos 7 días"
          text="Cuando registres algún día, podrás preparar aquí un resumen de tu semana."
          action={<Link className="btn btn--secondary" to="/hoy">Registrar hoy</Link>}
        />
      ) : (
        <>
          <section className="weekly-summary__section card" aria-labelledby="ws-cifras">
            <h2 className="weekly-summary__title" id="ws-cifras">Tu semana en cifras</h2>
            <ul className="weekly-summary__facts">
              <li>
                <strong>{summary.registeredDays}</strong> de 7 días registrados
              </li>
              {MOODS.map((mood, i) => (
                <li key={mood}>
                  <strong>{summary.moods[i]?.count ?? 0}</strong> {MOOD_LABELS[mood]}
                </li>
              ))}
              <li>
                <strong>{summary.achievementDays}</strong> {summary.achievementDays === 1 ? 'día' : 'días'} con logro
              </li>
            </ul>
            <p className="weekly-summary__muted">Calculado por Florecer a partir de tus registros, sin IA.</p>
          </section>

          <section className="weekly-summary__section card" aria-labelledby="ws-seleccion">
            <h2 className="weekly-summary__title" id="ws-seleccion">Qué entradas incluir</h2>
            <p className="weekly-summary__muted">
              Esto es exactamente lo que se usará: fecha, ánimo, emociones, reflexión y logro de cada entrada marcada. Los días sin
              texto no se pueden incluir.
            </p>
            <ul className="preview-list">
              {entries.map((entry) => {
                const disabled = !hasText(entry)
                const checked = !disabled && !excluded.has(versionKey(entry))
                return (
                  <li key={entry.id} className={`preview-list__item${checked ? ' preview-list__item--selected' : ''}`}>
                    <label className="preview-list__head">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled || send.status === 'sending'}
                        onChange={() => toggle(entry)}
                      />
                      <span className="preview-list__date">{formatLongDate(entry.date)}</span>
                      <span className={`mood-pill mood-pill--${entry.mood}`}>{MOOD_LABELS[entry.mood]}</span>
                    </label>
                    {entry.emotions.length > 0 && (
                      <p className="preview-list__emotions">
                        Emociones: {entry.emotions.map((e) => EMOTION_LABELS[e]).join(', ')}
                      </p>
                    )}
                    {disabled ? (
                      <p className="weekly-summary__muted">Sin reflexión ni logro escritos.</p>
                    ) : (
                      <>
                        <p className="preview-list__text">
                          <span className="preview-list__label">Reflexión: </span>
                          {entry.reflection.trim() || '(sin reflexión)'}
                        </p>
                        <p className="preview-list__text">
                          <span className="preview-list__label">Logro: </span>
                          {entry.achievement.trim() || '(sin logro)'}
                        </p>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="weekly-summary__section card" aria-labelledby="ws-acciones">
            <h2 className="weekly-summary__title" id="ws-acciones">Preparar el resumen</h2>
            {selected.length === 0 ? (
              <p className="weekly-summary__muted">Marca al menos una entrada con texto para continuar.</p>
            ) : (
              <p className="weekly-summary__muted">
                {selected.length} {selected.length === 1 ? 'entrada seleccionada' : 'entradas seleccionadas'}.
              </p>
            )}

            <div className="weekly-summary__option">
              <h3 className="weekly-summary__subtitle">Copiar para ChatGPT</h3>
              <p className="weekly-summary__muted">
                Copia el texto en tu dispositivo para pegarlo donde quieras. Florecer no lo envía a ningún sitio.
              </p>
              <Button variant="secondary" disabled={selected.length === 0} onClick={() => void copy()}>
                Copiar para ChatGPT
              </Button>
              <p role="status" className="weekly-summary__status">
                {copyState === 'copied' ? 'Texto copiado. Puedes pegarlo en ChatGPT.' : ''}
              </p>
              {copyState === 'manual' && (
                <div className="field">
                  <label className="field__label" htmlFor="ws-texto">
                    No hemos podido copiar automáticamente. Selecciona el texto y cópialo:
                  </label>
                  <textarea id="ws-texto" className="field__control" readOnly rows={8} value={chatGptText} />
                </div>
              )}
            </div>

            <div className="weekly-summary__option">
              <h3 className="weekly-summary__subtitle">Resumen con NVIDIA</h3>
              <p className="weekly-summary__muted">
                Al confirmar, el contenido de las entradas marcadas se envía a NVIDIA, un servicio externo, para redactar el resumen.
                Florecer no guarda el resumen. Es una lectura orientativa, no un diagnóstico.
              </p>
              <Button
                disabled={selected.length === 0}
                isLoading={send.status === 'sending'}
                loadingText="Preparando el resumen…"
                onClick={() => setSend({ status: 'confirming' })}
              >
                Enviar a NVIDIA…
              </Button>
              {send.status === 'error' && <InlineAlert tone="error">{send.message}</InlineAlert>}
            </div>
          </section>

          {send.status === 'done' && (
            <section ref={resultRef} tabIndex={-1} className="weekly-summary__section weekly-summary__result card" aria-labelledby="ws-resultado">
              <h2 className="weekly-summary__title" id="ws-resultado">Tu resumen</h2>
              <p className="weekly-summary__summary">{send.analysis.summary}</p>
              <ResultList title="Temas que se repiten" items={send.analysis.recurringThemes} />
              <ResultList title="Logros que mencionas" items={send.analysis.achievements} />
              <ResultList title="Preguntas para reflexionar" items={send.analysis.reflectionQuestions} />
              <ResultList title="Pequeños pasos, si te apetece" items={send.analysis.suggestedActions} />
              <p className="weekly-summary__disclaimer">{send.analysis.disclaimer}</p>
              <p className="weekly-summary__muted">Generado por IA a partir de las entradas que elegiste. Puede equivocarse.</p>
            </section>
          )}
        </>
      )}

      <ConfirmDialog
        open={send.status === 'confirming'}
        title="¿Enviar a NVIDIA?"
        message={`Se enviarán ${selected.length} ${selected.length === 1 ? 'entrada' : 'entradas'} (fecha, ánimo, emociones, reflexión y logro) a NVIDIA para preparar el resumen. Si cancelas, no se envía nada.`}
        confirmLabel="Enviar"
        destructive={false}
        onCancel={() => setSend({ status: 'idle' })}
        onConfirm={() => void confirmSend()}
      />
    </section>
  )
}

function ResultList({ title, items }: { title: string; items: readonly string[] }) {
  if (items.length === 0) return null
  return (
    <div className="weekly-summary__block">
      <h3 className="weekly-summary__subtitle">{title}</h3>
      <ul className="weekly-summary__list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
