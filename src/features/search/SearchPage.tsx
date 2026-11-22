import { useId, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { EMOTION_LABELS } from '@/features/journal/emotions.ts'
import { MoodIcon } from '@/features/journal/MoodIcon.tsx'
import { MOOD_LABELS, MOODS, type Mood } from '@/features/journal/mood.ts'
import { useAllEntries } from '@/features/journal/queries.ts'
import { formatLongDate, isValidLocalDate, monthKeyOf, type LocalDate } from '@/shared/lib/dates.ts'
import { ERROR_MESSAGES, isAppError } from '@/shared/lib/errors.ts'
import { useToday } from '@/shared/lib/useToday.ts'
import { Button } from '@/shared/ui/Button.tsx'
import { EmptyState } from '@/shared/ui/EmptyState.tsx'
import { InlineAlert } from '@/shared/ui/InlineAlert.tsx'
import { LoadingState } from '@/shared/ui/LoadingState.tsx'
import { PageHeading } from '@/shared/ui/PageHeading.tsx'
import { excerpt, hasActiveFilters, searchEntries, type SearchFilters } from './searchEntries.ts'

const MAX_RESULTS = 100

function dateParam(value: string | null): LocalDate | null {
  return value && isValidLocalDate(value) ? value : null
}

function moodParam(value: string | null): Mood | null {
  return MOODS.find((mood) => mood === value) ?? null
}

/**
 * Búsqueda en todo el diario (fase 2, docs/04): texto en reflexiones, logros
 * y emociones, y filtros por ánimo y fechas. Los filtros viven en la URL
 * (?q=&animo=&desde=&hasta=). Se busca en el navegador sobre las entradas
 * propias; no se envía el texto buscado a ningún servicio.
 */
export function SearchPage() {
  const today = useToday()
  const [params, setParams] = useSearchParams()
  const filters = useMemo<SearchFilters>(
    () => ({
      text: params.get('q') ?? '',
      mood: moodParam(params.get('animo')),
      from: dateParam(params.get('desde')),
      to: dateParam(params.get('hasta')),
      onlyAchievements: params.get('logro') === '1',
    }),
    [params],
  )
  const query = useAllEntries()
  const results = useMemo(() => searchEntries(query.data ?? [], filters), [query.data, filters])
  const ids = { text: useId(), mood: useId(), from: useId(), to: useId(), achievements: useId() }

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const active = hasActiveFilters(filters)
  const shown = results.slice(0, MAX_RESULTS)

  return (
    <section className="page search">
      <PageHeading
        eyebrow={<Link to="/calendario">← Calendario</Link>}
        title="Buscar en tu diario"
        lead="Encuentra días por lo que escribiste, por cómo te sentiste o por fechas."
        documentTitle="Buscar"
      />

      <form className="search__filters card" role="search" onSubmit={(event) => event.preventDefault()}>
        <div className="field search__text">
          <label className="field__label" htmlFor={ids.text}>
            Palabras
          </label>
          <input
            id={ids.text}
            className="field__control"
            type="search"
            value={filters.text}
            placeholder="Por ejemplo: paseo, examen, decepción…"
            onChange={(event) => update('q', event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor={ids.mood}>
            Ánimo
          </label>
          <select id={ids.mood} className="field__control" value={filters.mood ?? ''} onChange={(event) => update('animo', event.target.value)}>
            <option value="">Todos</option>
            {MOODS.map((mood) => (
              <option key={mood} value={mood}>
                {MOOD_LABELS[mood]}
              </option>
            ))}
          </select>
        </div>
        <div className="search__dates">
          <div className="field">
            <label className="field__label" htmlFor={ids.from}>
              Desde
            </label>
            <input
              id={ids.from}
              className="field__control"
              type="date"
              max={filters.to ?? today}
              value={filters.from ?? ''}
              onChange={(event) => update('desde', event.target.value)}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor={ids.to}>
              Hasta
            </label>
            <input
              id={ids.to}
              className="field__control"
              type="date"
              min={filters.from ?? undefined}
              max={today}
              value={filters.to ?? ''}
              onChange={(event) => update('hasta', event.target.value)}
            />
          </div>
        </div>
        <label className="search__check" htmlFor={ids.achievements}>
          <input
            id={ids.achievements}
            type="checkbox"
            checked={filters.onlyAchievements === true}
            onChange={(event) => update('logro', event.target.checked ? '1' : '')}
          />
          Solo días con logro
        </label>
        {active && (
          <Button variant="ghost" className="search__clear" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
            Quitar filtros
          </Button>
        )}
      </form>

      {query.isPending ? (
        <LoadingState label="Cargando tus registros…" />
      ) : query.isError && query.data === undefined ? (
        <InlineAlert
          tone="error"
          actions={
            <Button variant="secondary" onClick={() => void query.refetch()} isLoading={query.isFetching} loadingText="Reintentando…">
              Reintentar
            </Button>
          }
        >
          No hemos podido cargar tus registros. {isAppError(query.error) ? query.error.message : ERROR_MESSAGES.UNKNOWN}
        </InlineAlert>
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          title="Aún no tienes registros"
          text="Cuando guardes algún día, podrás buscarlo aquí."
          action={<Link className="btn btn--secondary" to="/hoy">Registrar hoy</Link>}
        />
      ) : results.length === 0 ? (
        <EmptyState title="No hay días que coincidan" text="Prueba con otras palabras o quita algún filtro." />
      ) : (
        <>
          <p className="search__count" role="status">
            {active
              ? `${results.length} ${results.length === 1 ? 'día coincide' : 'días coinciden'}`
              : `${results.length} ${results.length === 1 ? 'día registrado' : 'días registrados'}, del más reciente al más antiguo`}
            {results.length > MAX_RESULTS && `. Se muestran los ${MAX_RESULTS} más recientes; afina la búsqueda para ver otros.`}
          </p>
          <ul className="search__results">
            {shown.map((entry) => (
              <li key={entry.id}>
                <Link className="search-result card" to={`/calendario?mes=${monthKeyOf(entry.date)}&dia=${entry.date}`}>
                  <span className="search-result__top">
                    <span className="search-result__date">{formatLongDate(entry.date, { withYear: true })}</span>
                    <span className={`mood-pill mood-pill--${entry.mood}`}>
                      <MoodIcon mood={entry.mood} size={16} />
                      {MOOD_LABELS[entry.mood]}
                    </span>
                  </span>
                  {entry.emotions.length > 0 && (
                    <span className="search-result__emotions">{entry.emotions.map((e) => EMOTION_LABELS[e]).join(' · ')}</span>
                  )}
                  {entry.reflection.trim() && <span className="search-result__text">{excerpt(entry.reflection, filters.text)}</span>}
                  {entry.achievement.trim() && (
                    <span className="search-result__achievement">
                      <span className="visually-hidden">Logro: </span>✓ {entry.achievement}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
