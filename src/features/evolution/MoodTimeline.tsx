import { useId, type CSSProperties } from 'react'
import { MOOD_LABELS, MOODS, type Mood } from '@/features/journal/mood.ts'
import type { JournalEntry } from '@/features/journal/types.ts'
import { compareLocalDates, formatLongDate, localDateToDate, type LocalDate } from '@/shared/lib/dates.ts'
import { dateRange, monthsOfYear, yearOf, type Period } from './periods.ts'

interface MoodTimelineProps {
  period: Period
  today: LocalDate
  entries: ReadonlyMap<LocalDate, JournalEntry>
}

const monthShort = new Intl.DateTimeFormat('es-ES', { month: 'short' })
const monthLong = new Intl.DateTimeFormat('es-ES', { month: 'long' })
const weekdayShort = new Intl.DateTimeFormat('es-ES', { weekday: 'narrow' })

/**
 * Evolución en el tiempo: una casilla por día (semana y mes) o una barra
 * apilada por mes (año). "Sin registro" se distingue de cualquier ánimo y los
 * días futuros no se pintan como ausencias.
 */
export function MoodTimeline({ period, today, entries }: MoodTimelineProps) {
  const headingId = useId()
  return (
    <figure className="mood-timeline" aria-labelledby={headingId}>
      <figcaption className="visually-hidden" id={headingId}>
        {period.kind === 'year' ? 'Ánimos de cada mes' : 'Ánimo de cada día'}
      </figcaption>
      {period.kind === 'year' ? (
        <YearBars year={yearOf(period.from)} today={today} entries={entries} />
      ) : (
        <DayStrip period={period} today={today} entries={entries} />
      )}
    </figure>
  )
}

function DayStrip({ period, today, entries }: MoodTimelineProps) {
  const days = dateRange(period.from, period.to)
  const isWeek = period.kind === 'week'
  return (
    <ol className={`mood-timeline__days mood-timeline__days--${period.kind}`} style={{ '--days': days.length } as CSSProperties}>
      {days.map((date) => {
        const future = compareLocalDates(date, today) > 0
        const mood = entries.get(date)?.mood
        const state = future ? 'future' : (mood ?? 'empty')
        const dayNumber = Number(date.slice(8, 10))
        const label = future ? 'aún no ha llegado' : mood ? MOOD_LABELS[mood] : 'sin registro'
        return (
          <li key={date} className="mood-timeline__day">
            <span className={`mood-timeline__cell mood-timeline__cell--${state}`} aria-hidden="true" />
            {isWeek ? (
              <span className="mood-timeline__tick" aria-hidden="true">
                {weekdayShort.format(localDateToDate(date))}
              </span>
            ) : (
              (dayNumber === 1 || dayNumber % 5 === 0) && (
                <span className="mood-timeline__tick" aria-hidden="true">
                  {dayNumber}
                </span>
              )
            )}
            <span className="visually-hidden">
              {formatLongDate(date)}: {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function YearBars({ year, today, entries }: { year: number; today: LocalDate; entries: ReadonlyMap<LocalDate, JournalEntry> }) {
  const all = [...entries.values()]
  return (
    <ol className="mood-timeline__months">
      {monthsOfYear(year).map(({ month, from, to }) => {
        const future = compareLocalDates(from, today) > 0
        const inMonth = all.filter((e) => compareLocalDates(e.date, from) >= 0 && compareLocalDates(e.date, to) <= 0)
        const counts = new Map<Mood, number>(MOODS.map((mood) => [mood, inMonth.filter((e) => e.mood === mood).length]))
        const daysInMonth = dateRange(from, to).length
        const name = monthLong.format(localDateToDate(from))
        const description = future
          ? 'aún no ha llegado'
          : inMonth.length === 0
            ? 'sin registros'
            : `${inMonth.length} ${inMonth.length === 1 ? 'día registrado' : 'días registrados'}: ${MOODS.map(
                (mood) => `${MOOD_LABELS[mood]} ${counts.get(mood) ?? 0}`,
              ).join(', ')}`
        return (
          <li key={month} className={`mood-timeline__month${future ? ' mood-timeline__month--future' : ''}`}>
            <span className="mood-timeline__bar" aria-hidden="true">
              {/* Hueco = días del mes sin registro: la altura llena indica cuántos se registraron. */}
              <span className="mood-timeline__stack mood-timeline__stack--gap" style={{ flexGrow: daysInMonth - inMonth.length }} />
              {MOODS.map((mood) => {
                const count = counts.get(mood) ?? 0
                return count > 0 ? (
                  <span key={mood} className={`mood-timeline__stack mood-timeline__stack--${mood}`} style={{ flexGrow: count }} />
                ) : null
              })}
            </span>
            <span className="mood-timeline__tick" aria-hidden="true">
              {monthShort.format(localDateToDate(from)).replace('.', '').slice(0, 3)}
            </span>
            <span className="visually-hidden">
              {name}: {description}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
