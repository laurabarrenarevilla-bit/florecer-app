import { useEffect, useRef, useState } from 'react'
import { useCurrentUser } from '@/features/auth/authContext.ts'
import { WelcomeNotice } from '@/features/auth/WelcomeNotice.tsx'
import { formatLongDate } from '@/shared/lib/dates.ts'
import { ERROR_MESSAGES, isAppError } from '@/shared/lib/errors.ts'
import { capitalizeFirst, greetingForHour } from '@/shared/lib/text.ts'
import { useToday } from '@/shared/lib/useToday.ts'
import { Button } from '@/shared/ui/Button.tsx'
import { InlineAlert } from '@/shared/ui/InlineAlert.tsx'
import { LoadingState } from '@/shared/ui/LoadingState.tsx'
import { PageHeading } from '@/shared/ui/PageHeading.tsx'
import { useToast } from '@/shared/ui/toastContext.ts'
import { draftKey, hasDraft } from './draftStore.ts'
import { EntrySummary } from './EntrySummary.tsx'
import { JournalForm } from './JournalForm.tsx'
import { useEntryByDate, useSaveEntry } from './queries.ts'
import type { JournalEntryContent } from './types.ts'

export function TodayPage() {
  const today = useToday()
  const { id: userId, name } = useCurrentUser()
  const formDraftKey = draftKey(userId, today)
  const entryQuery = useEntryByDate(today)
  const save = useSaveEntry()
  const { showToast } = useToast()
  // Si quedó un borrador sin guardar (p. ej. tras caducar la sesión), se reabre el formulario.
  const [editing, setEditing] = useState(() => hasDraft(formDraftKey))
  // El saludo se calcula al abrir la página; no necesita cambiar mientras se escribe.
  const [greeting] = useState(() => greetingForHour(new Date().getHours()))
  const summaryRef = useRef<HTMLElement>(null)
  const focusSummaryRef = useRef(false)

  // Tras guardar, el foco pasa al resumen para que el lector de pantalla lo anuncie.
  useEffect(() => {
    if (focusSummaryRef.current && summaryRef.current) {
      summaryRef.current.focus()
      focusSummaryRef.current = false
    }
  })

  const entry = entryQuery.data ?? null

  const handleSubmit = async (content: JournalEntryContent): Promise<boolean> => {
    try {
      await save.mutateAsync(
        entry
          ? { kind: 'update', input: { ...content, date: today, expectedUpdatedAt: entry.updatedAt } }
          : { kind: 'create', input: { ...content, date: today } },
      )
    } catch (error) {
      // Si el día cambió en otra pestaña, se mantiene el formulario con el
      // borrador sobre la versión recién cargada.
      if (isAppError(error) && (error.code === 'ENTRY_CONFLICT' || error.code === 'ENTRY_NOT_FOUND')) setEditing(true)
      return false
    }
    setEditing(false)
    focusSummaryRef.current = true
    showToast('Tu día se ha guardado.')
    return true
  }

  const startEditing = () => {
    save.reset()
    setEditing(true)
  }

  const cancelEditing = () => {
    save.reset()
    setEditing(false)
  }

  const showForm = !entry || editing
  const lead = entry && !editing
    ? 'Ya has registrado este día. Puedes editarlo si quieres.'
    : 'Cada día es una oportunidad para conocerte un poco mejor.'

  return (
    <section className="page today">
      <PageHeading
        eyebrow={capitalizeFirst(formatLongDate(today))}
        title={name ? `${greeting}, ${name}` : greeting}
        lead={entryQuery.isSuccess ? lead : undefined}
        documentTitle="Hoy"
      />

      <WelcomeNotice />

      {entryQuery.isPending ? (
        <LoadingState label="Cargando tu día…" />
      ) : entryQuery.isError && entryQuery.data === undefined ? (
        <InlineAlert
          tone="error"
          actions={
            <Button variant="secondary" onClick={() => void entryQuery.refetch()} isLoading={entryQuery.isFetching} loadingText="Reintentando…">
              Reintentar
            </Button>
          }
        >
          No hemos podido cargar tu día. {isAppError(entryQuery.error) ? entryQuery.error.message : ERROR_MESSAGES.UNKNOWN}
        </InlineAlert>
      ) : showForm ? (
        <JournalForm
          initial={entry}
          draftKey={formDraftKey}
          moodLegend="¿Cómo te has sentido hoy?"
          submitLabel={entry ? 'Guardar cambios' : 'Guardar mi día'}
          savingLabel="Guardando…"
          isSaving={save.isPending}
          error={save.error}
          onSubmit={handleSubmit}
          onCancel={entry ? cancelEditing : undefined}
        />
      ) : (
        <EntrySummary
          ref={summaryRef}
          entry={entry}
          heading="Tu registro de hoy"
          actions={
            <Button variant="ghost" onClick={startEditing}>
              Editar
            </Button>
          }
        />
      )}
    </section>
  )
}
