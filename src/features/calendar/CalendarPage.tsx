import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { WelcomeNotice } from '@/features/auth/WelcomeNotice.tsx'
import { useEntriesBetween } from '@/features/journal/queries.ts'
import type { JournalEntry } from '@/features/journal/types.ts'
import { addMonths, isValidLocalDate, monthBounds, monthKeyOf, type LocalDate, type MonthKey } from '@/shared/lib/dates.ts'
import { ERROR_MESSAGES, isAppError } from '@/shared/lib/errors.ts'
import { useToday } from '@/shared/lib/useToday.ts'
import { Button } from '@/shared/ui/Button.tsx'
import { EmptyState } from '@/shared/ui/EmptyState.tsx'
import { InlineAlert } from '@/shared/ui/InlineAlert.tsx'
import { LoadingState } from '@/shared/ui/LoadingState.tsx'
import { PageHeading } from '@/shared/ui/PageHeading.tsx'
import { MIN_DATE, MIN_MONTH, resolveVisibleMonth } from './calendarGrid.ts'
import { DayDetailDialog } from './DayDetailDialog.tsx'
import { MonthCalendar } from './MonthCalendar.tsx'
import { MoodLegend } from './MoodLegend.tsx'

function parseDayParam(value: string | null): LocalDate | null {
  return value && isValidLocalDate(value) && value >= MIN_DATE ? value : null
}

/**
 * Calendario emocional. El mes y el día abiertos viven en la URL
 * (?mes=YYYY-MM&dia=YYYY-MM-DD): se pueden enlazar y "atrás" cierra el detalle.
 */
export function CalendarPage() {
  const today = useToday()
  const currentMonth = monthKeyOf(today)
  const [params, setParams] = useSearchParams()
  const day = parseDayParam(params.get('dia'))
  const month = resolveVisibleMonth(params.get('mes'), day, currentMonth)
  const { from, to } = monthBounds(month)
  const entriesQuery = useEntriesBetween(from, to)

  const entries = useMemo(
    () => new Map<LocalDate, JournalEntry>((entriesQuery.data ?? []).map((entry) => [entry.date, entry])),
    [entriesQuery.data],
  )

  const goToMonth = (next: MonthKey) => setParams({ mes: next })
  const openDay = (date: LocalDate) => setParams({ mes: monthKeyOf(date), dia: date })
  const closeDay = () => {
    if (params.has('dia')) setParams({ mes: month }, { replace: true })
  }

  const isCurrentMonth = month === currentMonth

  return (
    <section className="page calendar-page">
      <PageHeading title="Calendario emocional" lead="Elige un día para ver, completar o corregir su registro." documentTitle="Calendario" />

      <WelcomeNotice />

      <MonthCalendar
        month={month}
        today={today}
        entries={entries}
        selectedDay={day}
        canGoPrevious={month > MIN_MONTH}
        canGoNext={month < currentMonth}
        onPrevious={() => goToMonth(addMonths(month, -1))}
        onNext={() => goToMonth(addMonths(month, 1))}
        onSelectDay={openDay}
      />

      {!isCurrentMonth && (
        <Button variant="ghost" className="calendar-page__back" onClick={() => goToMonth(currentMonth)}>
          Volver al mes actual
        </Button>
      )}

      {entriesQuery.isPending ? (
        <LoadingState label="Cargando registros del mes…" />
      ) : entriesQuery.isError && entriesQuery.data === undefined ? (
        <InlineAlert
          tone="error"
          actions={
            <Button variant="secondary" onClick={() => void entriesQuery.refetch()} isLoading={entriesQuery.isFetching} loadingText="Reintentando…">
              Reintentar
            </Button>
          }
        >
          No hemos podido cargar este mes. {isAppError(entriesQuery.error) ? entriesQuery.error.message : ERROR_MESSAGES.UNKNOWN}
        </InlineAlert>
      ) : entries.size === 0 ? (
        <EmptyState
          title="Aún no hay registros en este mes"
          text="Cuando guardes un día, aparecerá aquí con el color de cómo te sentiste."
          action={isCurrentMonth ? <Link className="btn btn--secondary" to="/hoy">Registrar hoy</Link> : undefined}
        />
      ) : null}

      <MoodLegend />

      <DayDetailDialog date={day} today={today} onClose={closeDay} />
    </section>
  )
}
