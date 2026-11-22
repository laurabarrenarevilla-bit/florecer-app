import { useMemo, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useAllEntries, useEntriesBetween } from '@/features/journal/queries.ts'
import type { JournalEntry } from '@/features/journal/types.ts'
import { compareLocalDates, monthKeyOf, type LocalDate } from '@/shared/lib/dates.ts'
import { ERROR_MESSAGES, isAppError } from '@/shared/lib/errors.ts'
import { useToday } from '@/shared/lib/useToday.ts'
import { Button } from '@/shared/ui/Button.tsx'
import { EmptyState } from '@/shared/ui/EmptyState.tsx'
import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/ui/icons.tsx'
import { InlineAlert } from '@/shared/ui/InlineAlert.tsx'
import { LoadingState } from '@/shared/ui/LoadingState.tsx'
import { PageHeading } from '@/shared/ui/PageHeading.tsx'
import { AchievementList } from './AchievementList.tsx'
import { ComparisonTable } from './ComparisonTable.tsx'
import { EmotionBars } from './EmotionBars.tsx'
import { MoodDonut } from './MoodDonut.tsx'
import { MoodTimeline } from './MoodTimeline.tsx'
import {
  MIN_PERIOD_DATE,
  PERIOD_KINDS,
  PERIOD_LABELS,
  containsDate,
  dateRange,
  effectiveEnd,
  formatPeriod,
  kindParam,
  relativePeriodName,
  resolvePeriod,
  shiftPeriod,
  type Period,
  type PeriodKind,
} from './periods.ts'
import { MIN_DAYS_FOR_PATTERNS, currentStreak, describePatterns, longestStreak, summarize } from './stats.ts'
import { MIN_REFLECTIONS_FOR_WORDS, frequentWords } from './words.ts'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="evolution__section card" aria-label={title}>
      <h2 className="evolution__title">{title}</h2>
      {children}
    </section>
  )
}

/**
 * Evolución (fase 2, ADR-011): semana, mes o año con anillo de ánimos,
 * evolución en el tiempo, emociones concretas, comparación con el período
 * anterior, patrones descriptivos y logros. El período vive en la URL
 * (?vista=semana|mes|año&fecha=YYYY-MM-DD).
 */
export function EvolutionPage() {
  const today = useToday()
  const [params, setParams] = useSearchParams()
  const period = resolvePeriod(params.get('vista'), params.get('fecha'), today)
  const previousPeriod = shiftPeriod(period, -1)
  const end = effectiveEnd(period, today)

  const currentQuery = useEntriesBetween(period.from, end)
  const previousQuery = useEntriesBetween(previousPeriod.from, previousPeriod.to)

  const entries = useMemo(() => currentQuery.data ?? [], [currentQuery.data])
  const entryMap = useMemo(() => new Map<LocalDate, JournalEntry>(entries.map((e) => [e.date, e])), [entries])
  const summary = useMemo(() => summarize(entries, dateRange(period.from, end).length), [entries, period.from, end])
  const patterns = useMemo(() => describePatterns(entries, summary), [entries, summary])
  const words = useMemo(() => frequentWords(entries), [entries])

  // Las rachas globales necesitan todo el historial, no solo el período visible.
  const allQuery = useAllEntries()
  const streaks = useMemo(() => {
    if (!allQuery.data) return null
    const dates = allQuery.data.map((e) => e.date)
    return { current: currentStreak(dates, today), longest: longestStreak(dates) }
  }, [allQuery.data, today])
  const previousSummary = useMemo(
    () =>
      previousQuery.data
        ? summarize(previousQuery.data, dateRange(previousPeriod.from, previousPeriod.to).length)
        : null,
    [previousQuery.data, previousPeriod.from, previousPeriod.to],
  )

  const goTo = (next: Period) => setParams({ vista: kindParam(next.kind), fecha: next.from })
  const changeKind = (kind: PeriodKind) => {
    // Se conserva la referencia: el nuevo período contiene el inicio del actual (o hoy).
    const anchor = containsDate(period, today) ? today : period.from
    setParams({ vista: kindParam(kind), fecha: anchor })
  }
  const isCurrent = containsDate(period, today)
  const canGoBack = compareLocalDates(previousPeriod.to, MIN_PERIOD_DATE) >= 0
  const periodName = relativePeriodName(period.kind, 'current')

  return (
    <section className="page evolution">
      <PageHeading
        title="Tu evolución"
        lead="Cómo te has sentido a lo largo del tiempo, a partir de tus registros."
        documentTitle="Evolución"
      />

      <Link className="evolution__summary-link card" to="/evolucion/resumen">
        <span className="evolution__summary-title">
          Resumen de la semana <span aria-hidden="true">→</span>
        </span>
        <span className="evolution__muted">Revisa tus últimos 7 días y, si quieres, prepara un resumen con IA o cópialo para ChatGPT.</span>
      </Link>

      {streaks && streaks.longest > 0 && (
        <dl className="evolution__streaks">
          <div className="evolution__streak">
            <dt>Racha actual</dt>
            <dd>
              {streaks.current} {streaks.current === 1 ? 'día' : 'días'}
            </dd>
          </div>
          <div className="evolution__streak">
            <dt>Racha más larga</dt>
            <dd>
              {streaks.longest} {streaks.longest === 1 ? 'día' : 'días'}
            </dd>
          </div>
        </dl>
      )}

      <div className="evolution__controls">
        <ul className="segmented" aria-label="Período">
          {PERIOD_KINDS.map((kind) => (
            <li key={kind} className="segmented__item">
              <button
                type="button"
                className="segmented__option"
                aria-pressed={period.kind === kind}
                onClick={() => changeKind(kind)}
              >
                {PERIOD_LABELS[kind]}
              </button>
            </li>
          ))}
        </ul>

        <div className="evolution__nav">
          <Button
            variant="ghost"
            className="btn--icon"
            aria-label={`${PERIOD_LABELS[period.kind]} anterior`}
            disabled={!canGoBack}
            onClick={() => goTo(previousPeriod)}
          >
            <ChevronLeftIcon />
          </Button>
          <p className="evolution__period" aria-live="polite">
            {formatPeriod(period)}
          </p>
          <Button
            variant="ghost"
            className="btn--icon"
            aria-label={`${PERIOD_LABELS[period.kind]} siguiente`}
            disabled={isCurrent}
            onClick={() => goTo(shiftPeriod(period, 1))}
          >
            <ChevronRightIcon />
          </Button>
        </div>
        {!isCurrent && (
          <Button variant="ghost" className="evolution__back" onClick={() => goTo(resolvePeriod(kindParam(period.kind), today, today))}>
            Volver a {periodName}
          </Button>
        )}
      </div>

      {currentQuery.isPending ? (
        <LoadingState label="Calculando tu evolución…" />
      ) : currentQuery.isError && currentQuery.data === undefined ? (
        <InlineAlert
          tone="error"
          actions={
            <Button variant="secondary" onClick={() => void currentQuery.refetch()} isLoading={currentQuery.isFetching} loadingText="Reintentando…">
              Reintentar
            </Button>
          }
        >
          No hemos podido cargar tus registros. {isAppError(currentQuery.error) ? currentQuery.error.message : ERROR_MESSAGES.UNKNOWN}
        </InlineAlert>
      ) : summary.registeredDays === 0 ? (
        <EmptyState
          title="Aún no hay registros en este período"
          text="Cuando guardes algún día, aquí verás cómo te has sentido, sin cifras inventadas."
          action={isCurrent ? <Link className="btn btn--secondary" to="/hoy">Registrar hoy</Link> : undefined}
        />
      ) : (
        <div className="evolution__grid">
          <Section title="Cómo te has sentido">
            <MoodDonut moods={summary.moods} registeredDays={summary.registeredDays} />
          </Section>

          <Section title={period.kind === 'year' ? 'Mes a mes' : 'Día a día'}>
            <MoodTimeline period={period} today={today} entries={entryMap} />
            {period.kind !== 'year' && (
              <Link className="evolution__link" to={`/calendario?mes=${monthKeyOf(period.from)}`}>
                Ver en el calendario
              </Link>
            )}
          </Section>

          <Section title="Emociones concretas">
            <EmotionBars emotions={summary.emotions} entriesWithEmotions={summary.entriesWithEmotions} />
          </Section>

          <Section title="Palabras que más usas">
            {words.length > 0 ? (
              <>
                <ul className="word-list">
                  {words.map((w) => (
                    <li key={w.word} className="word-list__item">
                      <span className="word-list__word">{w.word}</span>
                      <span className="word-list__count">
                        {w.count} {w.count === 1 ? 'vez' : 'veces'}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="evolution__muted">Contadas en tus reflexiones de este período, sin palabras comunes como «que» o «pero».</p>
              </>
            ) : (
              <p className="evolution__muted">
                Aún no hay suficientes reflexiones para mostrar palabras frecuentes (hacen falta al menos {MIN_REFLECTIONS_FOR_WORDS} en
                el período y alguna palabra repetida).
              </p>
            )}
          </Section>

          <Section title="Patrones">
            {patterns.length > 0 ? (
              <>
                <ul className="evolution__patterns">
                  {patterns.map((pattern) => (
                    <li key={pattern}>{pattern}</li>
                  ))}
                </ul>
                <p className="evolution__muted">Son observaciones de tus registros, no un diagnóstico.</p>
              </>
            ) : (
              <p className="evolution__muted">
                Aún hay pocos registros para ver patrones: hacen falta al menos {MIN_DAYS_FOR_PATTERNS} días registrados en el
                período ({summary.registeredDays} por ahora).
              </p>
            )}
          </Section>

          <Section title="Comparación">
            <ComparisonTable
              currentLabel={formatPeriod(period)}
              previousLabel={formatPeriod(previousPeriod)}
              current={summary}
              previous={previousSummary}
              previousStatus={previousQuery.isPending ? 'loading' : previousSummary ? 'ready' : 'error'}
            />
          </Section>

          <Section title="Logros">
            <AchievementList entries={entries} />
          </Section>
        </div>
      )}
    </section>
  )
}
